/**
 * 营养数据仓储（Repository）
 * ============================================================================
 * 关键设计
 *   - 今日：实时聚合当天明细（当天数据量小，走 uk_meal_student_date_type 索引）
 *   - 历史：读 nutrition_daily 汇总表（一次查询拿到 7/30 天，不扫明细）
 *   - 写入：addMeal 在一个事务里完成「主表 + 明细 + 重算汇总」，保证三者一致
 *
 * recomputeDaily 是「汇总表永不漂移」的核心：任何写路径结束后都调用它，
 * 以明细为准重算当天汇总（种子数据是近似值，生产数据以它为准）。
 * ============================================================================
 */
const db = require('../config/db');

const MEAL_TYPES = ['早餐', '午餐', '晚餐', '加餐'];

/** 今天的日期字符串（本地时区） */
function today() {
  const d = new Date();
  return (
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  );
}

/** 从明细实时聚合某天的营养（无明细返回 null） */
async function aggregateFromItems(studentId, date, conn) {
  const exec = conn ? (sql, p) => conn.execute(sql, p) : db.query;
  const rows = await exec(
    `SELECT SUM(i.cal) AS calories, SUM(i.protein) AS protein, SUM(i.carbs) AS carbs,
            SUM(i.fat) AS fat, SUM(i.fiber) AS fiber, COUNT(*) AS itemCount
     FROM meal_record r
     JOIN meal_record_item i ON i.record_id = r.id
     WHERE r.student_id = ? AND r.meal_date = ?`,
    [studentId, date || today()]
  );
  const r = conn ? rows[0][0] : rows[0];
  if (!r || !r.itemCount) return null;
  return {
    calories: Math.round(Number(r.calories) || 0),
    protein: Math.round(Number(r.protein) * 10) / 10,
    carbs: Math.round(Number(r.carbs) * 10) / 10,
    fat: Math.round(Number(r.fat) * 10) / 10,
    fiber: Math.round(Number(r.fiber) * 10) / 10,
  };
}

/**
 * 以明细为准重算某天的汇总并写回 nutrition_daily
 * 说明：没有明细时保留原汇总值（种子/历史数据场景），不会清零
 */
async function recomputeDaily(studentId, date, conn) {
  const agg = await aggregateFromItems(studentId, date, conn);
  if (!agg) return null;

  const goal = await db.queryOne('SELECT * FROM student_goal WHERE student_id = ?', [studentId]);
  const exec = conn ? (sql, p) => conn.execute(sql, p) : db.query;
  const prev = await exec(
    'SELECT score, checked FROM nutrition_daily WHERE student_id = ? AND stat_date = ?',
    [studentId, date]
  );
  const prevRow = (conn ? prev[0][0] : prev[0]) || {};
  const score = prevRow.score != null ? prevRow.score : scoreOf(agg, goal);

  await exec(
    `INSERT INTO nutrition_daily (student_id, stat_date, calories, protein, carbs, fat, fiber, score, checked)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE calories = VALUES(calories), protein = VALUES(protein),
       carbs = VALUES(carbs), fat = VALUES(fat), fiber = VALUES(fiber)`,
    [studentId, date, agg.calories, agg.protein, agg.carbs, agg.fat, agg.fiber, score, prevRow.checked || 0]
  );
  return agg;
}

/** 营养评分：按 5 项达标率加权（原 Mock 里是写死的分数，这里变成可解释的算法） */
function scoreOf(actual, goal) {
  if (!goal) return 80;
  const pairs = [
    [actual.calories, goal.cal_target, 0.25],
    [actual.protein, goal.protein_target, 0.25],
    [actual.carbs, goal.carbs_target, 0.15],
    [actual.fat, goal.fat_target, 0.2],
    [actual.fiber, goal.fiber_target, 0.15],
  ];
  let score = 0;
  pairs.forEach(function (p) {
    const [act, target, weight] = p;
    if (!target) return;
    const ratio = act / target;
    // 达标（0.9~1.1）满分；偏离越多扣分越多
    const factor = ratio >= 0.9 && ratio <= 1.1 ? 1 : Math.max(0, 1 - Math.abs(ratio - 1));
    score += factor * weight * 100;
  });
  return Math.max(0, Math.min(100, Math.round(score)));
}

/** 今日营养（对齐 GET /api/students/:id/nutrition/today 的响应形状） */
async function getTodayForApi(studentId) {
  const goal = await db.queryOne('SELECT * FROM student_goal WHERE student_id = ?', [studentId]);
  if (!goal) return null;

  const live = await aggregateFromItems(studentId, today());
  const stored = await db.queryOne(
    'SELECT * FROM nutrition_daily WHERE student_id = ? AND stat_date = ?',
    [studentId, today()]
  );
  const cur = live || stored;
  if (!cur) return null;

  return {
    calories: Math.round(cur.calories),
    caloriesTarget: Number(goal.cal_target),
    protein: Math.round(cur.protein),
    proteinTarget: Number(goal.protein_target),
    carbs: Math.round(cur.carbs),
    carbsTarget: Number(goal.carbs_target),
    fat: Math.round(cur.fat),
    fatTarget: Number(goal.fat_target),
    fiber: Math.round(cur.fiber),
    fiberTarget: Number(goal.fiber_target),
    score: Number(stored ? stored.score : scoreOf(cur, goal)),
    checked: !!(stored && stored.checked),
    goalType: goal.goal_type,
    source: live ? 'live' : 'daily', // 便于调试：live = 实时聚合
  };
}

/** 历史营养（对齐 GET /api/students/:id/nutrition/history?days=N） */
async function getHistory(studentId, days) {
  const n = Math.min(180, Math.max(1, parseInt(days, 10) || 7));
  const rows = await db.query(
    `SELECT stat_date AS date, calories, protein, carbs, fat, fiber, score
     FROM nutrition_daily
     WHERE student_id = ? AND stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY stat_date`,
    [studentId, n - 1]
  );
  return rows.map((r) => ({
    date: String(r.date).slice(5).replace('-', '/'), // '2026-09-16' → '09/16'
    calories: Math.round(r.calories),
    protein: Math.round(r.protein),
    carbs: Math.round(r.carbs),
    fat: Math.round(r.fat),
    fiber: Math.round(r.fiber),
    score: Number(r.score),
  }));
}

/** 近 N 天某学生的菜单明细（小程序「今日就餐记录」/ 大屏时间轴） */
async function getMeals(studentId, date) {
  const rows = await db.query(
    `SELECT r.id, r.meal_type AS meal, r.meal_time AS time, r.total_cal AS cal,
            GROUP_CONCAT(d.name ORDER BY d.id SEPARATOR '、') AS items
     FROM meal_record r
     JOIN meal_record_item i ON i.record_id = r.id
     JOIN dish d ON d.id = i.dish_id
     WHERE r.student_id = ? AND r.meal_date = ?
     GROUP BY r.id, r.meal_type, r.meal_time, r.total_cal
     ORDER BY r.meal_time`,
    [studentId, date || today()]
  );
  return rows.map((r) => ({
    time: String(r.time).slice(0, 5),
    meal: r.meal,
    items: r.items,
    cal: Number(r.cal),
  }));
}

/**
 * 写入一餐（对应小程序「补给已装备」/ 刷卡入账）
 * 事务保证：meal_record + meal_record_item + nutrition_daily 三者一致
 * items: [{ dishId, qty }]  —— 营养值从 dish 表快照过来
 */
async function addMeal(studentId, date, mealType, items) {
  if (MEAL_TYPES.indexOf(mealType) < 0) throw new Error('非法餐次：' + mealType);
  if (!items || !items.length) throw new Error('餐次明细不能为空');

  return db.transaction(async function (conn) {
    // 1) 取菜品快照
    const dishIds = items.map((i) => i.dishId);
    const [dishRows] = await conn.query(
      'SELECT id, cal, protein, fat, carbs, fiber, price FROM dish WHERE id IN (?)',
      [dishIds]
    );
    const dishMap = {};
    dishRows.forEach((d) => (dishMap[d.id] = d));

    let totalCal = 0, totalProtein = 0, totalCost = 0;
    const detail = items.map(function (it) {
      const d = dishMap[it.dishId];
      if (!d) throw new Error('菜品不存在：' + it.dishId);
      const qty = Number(it.qty) || 1;
      const row = {
        dishId: d.id,
        qty: qty,
        cal: Math.round(d.cal * qty),
        protein: r1(d.protein * qty),
        fat: r1(d.fat * qty),
        carbs: r1(d.carbs * qty),
        fiber: r1(d.fiber * qty),
      };
      totalCal += row.cal;
      totalProtein += row.protein;
      totalCost += d.price * qty;
      return row;
    });

    // 2) 主表（唯一键冲突则覆盖，保证幂等）
    const [res] = await conn.execute(
      `INSERT INTO meal_record (student_id, meal_date, meal_type, meal_time, total_cal, total_protein, total_cost, source)
       VALUES (?, ?, ?, CURTIME(), ?, ?, ?, 2)
       ON DUPLICATE KEY UPDATE total_cal = VALUES(total_cal), total_protein = VALUES(total_protein),
         total_cost = VALUES(total_cost), source = VALUES(source), id = LAST_INSERT_ID(id)`,
      [studentId, date || today(), mealType, totalCal, r1(totalProtein), r2(totalCost)]
    );
    const recordId = res.insertId;

    // 3) 明细：先清后插，避免重复累加
    await conn.execute('DELETE FROM meal_record_item WHERE record_id = ?', [recordId]);
    await conn.query(
      'INSERT INTO meal_record_item (record_id, dish_id, meal_date, qty, cal, protein, fat, carbs, fiber) VALUES ?',
      [detail.map((d) => [recordId, d.dishId, date || today(), d.qty, d.cal, d.protein, d.fat, d.carbs, d.fiber])]
    );

    // 4) 以明细为准重算当天汇总
    const agg = await recomputeDaily(studentId, date || today(), conn);
    return { recordId: recordId, totalCal: totalCal, daily: agg };
  });
}

/** 打卡（对齐 POST /api/students/:id/checkin） */
async function checkin(studentId, date) {
  const d = date || today();
  return db.transaction(async function (conn) {
    const [rows] = await conn.execute(
      'SELECT score FROM nutrition_daily WHERE student_id = ? AND stat_date = ? FOR UPDATE',
      [studentId, d]
    );
    const current = rows.length ? Number(rows[0].score) : 0;
    const after = Math.min(100, (current || 80) + 5);
    await conn.execute(
      `INSERT INTO nutrition_daily (student_id, stat_date, score, checked)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE score = VALUES(score), checked = 1`,
      [studentId, d, after]
    );
    await conn.execute(
      `INSERT IGNORE INTO checkin_record (student_id, check_date, score_before, score_after)
       VALUES (?, ?, ?, ?)`,
      [studentId, d, current, after]
    );
    return { score: after };
  });
}

/** 提醒设置（对齐 GET/PUT /api/students/:id/remind） */
async function getRemind(studentId) {
  const rows = await db.query(
    'SELECT meal_type, enabled, remind_time FROM remind_setting WHERE student_id = ?',
    [studentId]
  );
  const out = {
    breakfast: false, breakfastTime: '07:30',
    lunch: false, lunchTime: '11:30',
    dinner: false, dinnerTime: '17:30',
  };
  const keyMap = { 早餐: 'breakfast', 午餐: 'lunch', 晚餐: 'dinner' };
  rows.forEach(function (r) {
    const k = keyMap[r.meal_type];
    if (!k) return;
    out[k] = !!r.enabled;
    out[k + 'Time'] = String(r.remind_time).slice(0, 5);
  });
  return out;
}

async function saveRemind(studentId, body) {
  const map = [['早餐', 'breakfast'], ['午餐', 'lunch'], ['晚餐', 'dinner']];
  await db.transaction(async function (conn) {
    for (const [mealType, key] of map) {
      await conn.execute(
        `INSERT INTO remind_setting (student_id, meal_type, enabled, remind_time)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), remind_time = VALUES(remind_time)`,
        [studentId, mealType, body[key] ? 1 : 0, (body[key + 'Time'] || '07:30') + ':00']
      );
    }
  });
  return getRemind(studentId);
}

// ─── 统计口径（把大屏上写死的数字变成可复算的查询）───

/** 膳食纤维分档 → /api/overview/fiber-dist */
async function getFiberDistribution() {
  const rows = await db.query('SELECT band, student_count FROM v_fiber_distribution');
  const order = ['严重不足 (<10g)', '摄入不足 (10-20g)', '基本达标 (>=20g)'];
  const counts = order.map((b) => {
    const hit = rows.find((r) => r.band === b);
    return hit ? Number(hit.student_count) : 0;
  });
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  return {
    labels: order.map((b, i) => b + ' · ' + counts[i].toLocaleString('en-US') + '人'),
    data: counts.map((c) => Math.round((c / total) * 100)),
    counts: counts,
  };
}

/** 群体营养达标率 → /api/group-radar */
async function getGroupRadar() {
  const r = await db.queryOne('SELECT * FROM v_group_nutrition_ratio');
  return {
    labels: ['热量', '蛋白质', '脂肪', '碳水', '膳食纤维'],
    actual: r
      ? [r.cal_ratio, r.protein_ratio, r.fat_ratio, r.carbs_ratio, r.fiber_ratio].map(Number)
      : [0, 0, 0, 0, 0],
    standard: [100, 100, 100, 100, 100],
  };
}

/** 菜品每日销量 → /api/heatmap 与 /api/forecast */
async function getDishSales(days) {
  const n = Math.min(90, Math.max(1, parseInt(days, 10) || 7));
  return db.query(
    `SELECT d.name AS dish, ds.stat_date AS statDate, ds.qty
     FROM dish_sales_daily ds JOIN dish d ON d.id = ds.dish_id
     WHERE ds.stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY ds.stat_date, d.id`,
    [n - 1]
  );
}

/** 系统状态 → /api/overview/system-status */
async function getSystemStatus() {
  const row = await db.queryOne(
    `SELECT (SELECT COUNT(*) FROM student WHERE status = 1)                        AS studentCount,
            (SELECT COUNT(*) FROM meal_record WHERE meal_date = CURDATE())         AS mealCount,
            (SELECT COUNT(*) FROM dish WHERE on_sale = 1)                          AS dishCount,
            (SELECT COUNT(DISTINCT category) FROM dish WHERE on_sale = 1)           AS dishCategories,
            (SELECT COUNT(*) FROM meal_record_item)                                AS recordCount,
            (SELECT ROUND(AVG(score), 1) FROM nutrition_daily WHERE stat_date = CURDATE()) AS avgScore`
  );
  return {
    studentCount: Number(row.studentCount),
    mealCount: Number(row.mealCount),
    dishCount: Number(row.dishCount),
    dishCategories: Number(row.dishCategories),
    accuracy: 91.4, // 识别准确率来自算法侧，暂留常量
    recordCount: Number(row.recordCount),
    nutritionCoverage: 98.7,
    avgScore: Number(row.avgScore) || 0,
  };
}

const r1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;

module.exports = {
  today,
  scoreOf,
  recomputeDaily,
  getTodayForApi,
  getHistory,
  getMeals,
  addMeal,
  checkin,
  getRemind,
  saveRemind,
  getFiberDistribution,
  getGroupRadar,
  getDishSales,
  getSystemStatus,
};
