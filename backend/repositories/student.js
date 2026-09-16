/**
 * 学生数据仓储（Repository）
 * ============================================================================
 * 职责：把 SQL 结果映射成**与现有 Mock 接口完全一致的字段形状**，
 *       让 routes/student.js 只需把 require 从 models/data 换成这里，前端零改动。
 *
 * 约定
 *   - 所有查询使用 ? 占位符，绝不拼接字符串
 *   - 返回「纯数据」，不返回 mysql2 的 RowDataPacket（避免泄漏驱动细节）
 *   - 派生字段（badge / class / status 文案）在 services 层算，不在这层
 * ============================================================================
 */
const db = require('../config/db');

const STUDENT_COLUMNS = `
  s.id, s.account, s.name, s.gender, s.age, s.avatar, s.diet_type AS dietType,
  s.height_cm AS height, s.weight_kg AS weight, s.bmi,
  c.name AS college,
  g.goal_type AS goalType, g.cal_target AS calTarget, g.protein_target AS proteinTarget,
  g.carbs_target AS carbsTarget, g.fat_target AS fatTarget, g.fiber_target AS fiberTarget,
  p.level, p.coin, p.theme, p.check_days AS checkDays, p.avg_score AS avgScore
`;

const FROM_JOIN = `
  FROM student s
  LEFT JOIN college c ON c.id = s.college_id
  LEFT JOIN student_goal g ON g.student_id = s.id
  LEFT JOIN student_game_profile p ON p.student_id = s.id
`;

/** 单个学生（含目标与游戏档案），形状对齐原 studentProfiles[id] */
async function findById(id) {
  const row = await db.queryOne(
    `SELECT ${STUDENT_COLUMNS} ${FROM_JOIN} WHERE s.id = ?`,
    [id]
  );
  if (!row) return null;
  row.allergyList = await listAllergies(id);
  return row;
}

/** 学生列表（对应 GET /api/students 的精简字段） */
async function listAll() {
  const rows = await db.query(
    `SELECT s.id, s.name, s.gender, s.age, s.college_id AS collegeId, c.name AS college
     FROM student s LEFT JOIN college c ON c.id = s.college_id
     ORDER BY s.id`
  );
  return rows;
}

/** 学生总数（对应 /api/overview/system-status 的 studentCount） */
async function count() {
  const row = await db.queryOne('SELECT COUNT(*) AS total FROM student WHERE status = 1');
  return Number(row.total);
}

/** 过敏原列表 */
async function listAllergies(id) {
  const rows = await db.query(
    `SELECT a.name FROM student_allergen sa JOIN allergen a ON a.id = sa.allergen_id
     WHERE sa.student_id = ? ORDER BY a.id`,
    [id]
  );
  return rows.map((r) => r.name);
}

/**
 * 更新档案（对应 PUT /api/students/:id）
 * BMI 由身高体重重算 —— 与原实现保持一致
 */
async function updateProfile(id, patch) {
  const allowed = {
    name: 'name', gender: 'gender', age: 'age', avatar: 'avatar',
    dietType: 'diet_type', height: 'height_cm', weight: 'weight_kg',
  };
  return db.transaction(async function (conn) {
    const sets = [];
    const params = [];
    Object.keys(allowed).forEach(function (k) {
      if (patch[k] !== undefined) {
        sets.push(allowed[k] + ' = ?');
        params.push(patch[k]);
      }
    });

    const height = patch.height !== undefined ? patch.height : null;
    const weight = patch.weight !== undefined ? patch.weight : null;
    if (height && weight) {
      sets.push('bmi = ?');
      params.push(Math.round((weight / Math.pow(height / 100, 2)) * 10) / 10);
    } else if (sets.length === 0) {
      return findById(id);
    }
    params.push(id);
    await conn.execute(`UPDATE student SET ${sets.join(', ')} WHERE id = ?`, params);

    // 偏好项单独处理
    if (patch.allergyList && Array.isArray(patch.allergyList)) {
      await conn.execute('DELETE FROM student_allergen WHERE student_id = ?', [id]);
      for (const name of patch.allergyList) {
        await conn.execute(
          `INSERT IGNORE INTO student_allergen (student_id, allergen_id)
           SELECT ?, id FROM allergen WHERE name = ?`,
          [id, name]
        );
      }
    }
    return findById(id);
  });
}

/** 营养目标（对应 todayNutritionStore 的 *Target 部分） */
async function findGoal(id) {
  return db.queryOne('SELECT * FROM student_goal WHERE student_id = ?', [id]);
}

/** 保存目标 */
async function saveGoal(id, goal) {
  await db.query(
    `INSERT INTO student_goal (student_id, goal_type, cal_target, protein_target, carbs_target, fat_target, fiber_target)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE goal_type = VALUES(goal_type), cal_target = VALUES(cal_target),
       protein_target = VALUES(protein_target), carbs_target = VALUES(carbs_target),
       fat_target = VALUES(fat_target), fiber_target = VALUES(fiber_target)`,
    [id, goal.goalType, goal.calTarget, goal.proteinTarget, goal.carbsTarget, goal.fatTarget, goal.fiberTarget]
  );
  return findGoal(id);
}

/** 账号鉴权用：取密码哈希（auth.js 的登录流程改为调用它） */
async function findCredential(account) {
  const row = await db.queryOne(
    `SELECT s.id, s.account, s.password_hash AS passwordHash, s.name, s.status,
            c.name AS college
     FROM student s LEFT JOIN college c ON c.id = s.college_id
     WHERE s.account = ? OR s.id = ? LIMIT 1`,
    [account, /^\d+$/.test(String(account)) ? account : 0]
  );
  return row;
}

/** 按学院统计人数与平均评分（对应大屏「各学院营养评分对比」） */
async function statsByCollege(days) {
  return db.query(
    `SELECT c.name AS college,
            COUNT(DISTINCT s.id) AS studentCount,
            ROUND(AVG(d.score), 1) AS avgScore
     FROM student s
     JOIN college c ON c.id = s.college_id
     LEFT JOIN nutrition_daily d
       ON d.student_id = s.id AND d.stat_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY c.id, c.name
     ORDER BY avgScore DESC`,
    [days || 7]
  );
}

module.exports = {
  findById,
  listAll,
  count,
  listAllergies,
  updateProfile,
  findGoal,
  saveGoal,
  findCredential,
  statsByCollege,
};
