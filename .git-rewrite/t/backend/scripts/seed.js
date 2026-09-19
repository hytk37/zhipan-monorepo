#!/usr/bin/env node
/**
 * 智慧膳系统 · 数据库种子脚本
 * ============================================================================
 * 目标：把现有的内存 Mock（models/data.js）与缩放后的统计口径，
 *       变成一份**持久化、可查询、分布对齐**的初始数据。
 *
 * 用法
 *   node scripts/seed.js --dry-run                   只生成不入库，打印规模与分布自检
 *   node scripts/seed.js --out=sql/seed-demo.sql     生成 SQL 文件（默认仅 6 名演示学生）
 *   node scripts/seed.js --exec                      直连数据库写入（需先执行 schema.sql）
 *   node scripts/seed.js --exec --students=4000 --days-summary=30 --days-meals=7
 *
 * 参数
 *   --students=N       学生总数（默认 4000）
 *   --days-summary=N   nutrition_daily 天数（默认 30）
 *   --days-meals=N     用餐明细天数（默认 7）
 *   --seed=N           随机种子（默认 20260916，保证可复现）
 *   --reset            --exec 时先清空数据表（默认开启）
 *
 * 生成口径（与前端大屏显示一致）
 *   学生 4000；日均就餐 4278 人次（约 1.07 餐/人·天，早 25% / 午 42% / 晚 33%）
 *   纤维分档 严重不足 28% / 摄入不足 44% / 基本达标 28%
 *   评分分布 80+ 36% / 70-79 27% / 60-69 18% / <60 19%
 *   BMI 分布 偏瘦 12% / 正常 64.6% / 偏重 17.6% / 肥胖 5.9%
 *
 * 注意：明细（meal_record_item）按"近似匹配当天目标"生成，汇总（nutrition_daily）
 *       按目标 × 摄入系数生成，两者在种子数据中是**近似一致**的。生产环境应以明细为准
 *       重算汇总 —— 见 repositories/nutrition.js 的 recomputeDaily()。
 * ============================================================================
 */
require('../config/env');

const fs = require('fs');
const path = require('path');

const DATA = require('../models/data');
const { hashPassword } = require('../utils/password');

const ROOT = path.join(__dirname, '..');

// 学生密码统一为 123456。scrypt 单次约数十毫秒，4000 名学生逐个哈希会把脚本拖到几分钟，
// 因此预先算好一小池哈希（盐各不同）后轮换复用 —— 兼顾性能与「同密码不同哈希」。
const PWD_POOL = Array.from({ length: 32 }, () => hashPassword('123456'));
let pwdCursor = 0;
const nextStudentHash = () => PWD_POOL[pwdCursor++ % PWD_POOL.length];

// ───────────────────────────── 参数 ─────────────────────────────
function parseArgs(argv) {
  const opts = {
    mode: 'dry-run',
    out: null,
    students: parseInt(process.env.SEED_STUDENTS, 10) || 4000,
    daysSummary: parseInt(process.env.SEED_DAYS_SUMMARY, 10) || 30,
    daysMeals: parseInt(process.env.SEED_DAYS_MEALS, 10) || 7,
    seed: 20260916,
    reset: null,
    explicitStudents: false,
  };
  argv.forEach(function (a) {
    if (a === '--exec') opts.mode = 'exec';
    else if (a === '--dry-run') opts.mode = 'dry-run';
    else if (a === '--reset') opts.reset = true;
    else if (a.startsWith('--out=')) {
      opts.out = a.slice(6);
      if (opts.mode !== 'exec') opts.mode = 'out';
    } else if (a.startsWith('--students=')) {
      opts.students = parseInt(a.split('=')[1], 10);
      opts.explicitStudents = true;
    } else if (a.startsWith('--days-summary=')) opts.daysSummary = parseInt(a.split('=')[1], 10);
    else if (a.startsWith('--days-meals=')) opts.daysMeals = parseInt(a.split('=')[1], 10);
    else if (a.startsWith('--seed=')) opts.seed = parseInt(a.split('=')[1], 10);
  });
  if (opts.reset === null) opts.reset = opts.mode === 'exec';
  return opts;
}

// ───────────────────────── 工具 ─────────────────────────
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length) % arr.length];
const between = (rnd, min, max) => min + rnd() * (max - min);
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;

function shuffle(rnd, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

/** 按权重把 N 个名额分配到各档，返回长度 N 的「档位索引」数组（已打乱） */
function assignBuckets(rnd, n, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.round((w / total) * n));
  let diff = n - counts.reduce((a, b) => a + b, 0);
  let i = 0;
  while (diff !== 0) {
    const idx = i % counts.length;
    if (diff > 0) { counts[idx]++; diff--; }
    else if (counts[idx] > 0) { counts[idx]--; diff++; }
    i++;
  }
  const out = [];
  counts.forEach((c, bucket) => { for (let k = 0; k < c; k++) out.push(bucket); });
  return shuffle(rnd, out);
}

// ─────────────────── 字典（顺序与 schema.sql 的 INSERT 一致） ───────────────────
const COLLEGES = [
  '计算机学院', '经管学院', '文学院', '理学院', '工程学院',
  '医学院', '艺术学院', '体育学院', '外国语学院',
];
const CANTEENS = ['第一食堂', '第二食堂', '第三食堂'];
const ALLERGENS = ['花生', '海鲜', '虾蟹', '芒果', '牛奶', '鸡蛋', '麸质', '坚果'];
const TAGS = ['高蛋白', '低脂', '高纤维', '低卡', '低GI', '粗粮', '补铁', '人气王', '易消化'];

const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦许何吕张孔曹严华金魏陶姜'.split('');
const GIVEN = ['伟', '芳', '娜', '敏', '静', '磊', '洋', '强', '军', '杰', '娟', '艳', '涛', '明', '超', '秀英', '霞', '平', '刚', '桂英', '子涵', '宇轩'];
const AVATARS_M = ['👨🏻', '👨🏼', '👨🏽', '👦🏻', '👦🏽'];
const AVATARS_F = ['👩🏻', '👩🏾', '👩🏽', '👧🏻', '🧑🏻'];
const DIET_TYPES = ['无限制', '无限制', '无限制', '无限制', '清真', '蛋奶素', '无麸质', '低敏'];

function collegeIdOf(name) {
  const i = COLLEGES.indexOf(name);
  return i >= 0 ? i + 1 : 1;
}

// ─────────────────────────── 菜品 ───────────────────────────
// 类别：foodDB 每条自带 cat 字段（第13周真实食谱）
// 过敏原映射：按菜品名标注（虾蟹/鸡蛋/牛奶/麸质/花生）
const DISH_ALLERGENS = {
  // 虾蟹
  豆腐烧三鲜: ['虾蟹'], 虾仁绍子蒸蛋: ['虾蟹', '鸡蛋'], 干锅排骨虾: ['虾蟹'],
  虾皮带丝汤: ['虾蟹'], 虾仁三鲜炒蛋: ['虾蟹', '鸡蛋'],
  // 鸡蛋
  营养蛋: ['鸡蛋'], 卤蛋: ['鸡蛋'], 煎荷包蛋: ['鸡蛋'], 蒸水蛋: ['鸡蛋'],
  番茄炒蛋: ['鸡蛋'], 绍子蒸水蛋: ['鸡蛋'], 西红柿鸡蛋面: ['鸡蛋', '麸质'],
  紫菜蛋花汤: ['鸡蛋'], 西红柿蛋花汤: ['鸡蛋'], 蛋炒饭: ['鸡蛋'],
  肉松三明治: ['鸡蛋', '麸质'], 鸡汤馄饨: ['鸡蛋', '麸质'],
  // 牛奶
  学生纯牛奶: ['牛奶'], 奶香馒头: ['牛奶', '麸质'], 椰奶布丁: ['牛奶'],
  // 花生
  黄豆花生烧猪脚: ['花生'],
};

const MEAL_FIT = {
  早餐: ['营养蛋', '玉米粥', '学生纯牛奶', '豆浆', '莲白肉包', '油条'],
  午餐: ['干锅排骨', '土豆排骨', '玉米饭', '蒜蓉西兰花', '番茄炒蛋', '鱼香肉丝', '红薯饭'],
  晚餐: ['胡萝卜烧肘子', '魔芋烧鱼', '红豆饭', '金钩冬瓜', '青瓜三鲜汤', '双椒玉米'],
};

function buildDishes() {
  return Object.values(DATA.foodDB).map(function (f, i) {
    return {
      id: i + 1,
      canteenId: (i % CANTEENS.length) + 1,
      name: f.name,
      emoji: f.emoji,
      category: f.cat || '热菜',
      cal: f.cal,
      protein: f.protein,
      fat: f.fat,
      carbs: f.carbs,
      fiber: f.fiber,
      price: Math.max(3, Math.round((f.cal / 100) * 3 + 2)),
      description: f.desc,
      tags: (f.tags || []).filter((t) => TAGS.indexOf(t) >= 0),
      allergens: DISH_ALLERGENS[f.name] || [],
    };
  });
}

// ─────────────────────── 分布口径 ───────────────────────
const FIBER_BAND = [
  { name: '严重不足 (<10g)', weight: 28, fiberRatio: [0.12, 0.35] },
  { name: '摄入不足 (10-20g)', weight: 44, fiberRatio: [0.42, 0.78] },
  { name: '基本达标 (>=20g)', weight: 28, fiberRatio: [0.82, 1.15] },
];
const SCORE_BAND = [
  { name: '优秀 80+', weight: 35.95, score: [80, 98], calRatio: [0.88, 1.09] },
  { name: '良好 70-79', weight: 26.8, score: [70, 79], calRatio: [0.99, 1.25] },
  { name: '一般 60-69', weight: 18, score: [60, 69], calRatio: [1.09, 1.40] },
  { name: '较差 <60', weight: 19.25, score: [35, 59], calRatio: [1.25, 1.66] },
];
// 脂肪是否超标：大屏口径 68%，单独按比例分配（比用系数区间逼近更可控）
const FAT_OVER = {
  over: 68, // 超标：脂肪摄入系数 1.05~1.75
  ok: 32,   // 达标：0.60~0.98
};
const BMI_BAND = [
  { name: '偏瘦 <18.5', weight: 12, bmi: [16.0, 18.4] },
  { name: '正常 18.5-24', weight: 64.58, bmi: [18.5, 23.9] },
  { name: '偏重 24-28', weight: 17.55, bmi: [24.0, 27.9] },
  { name: '肥胖 >28', weight: 5.88, bmi: [28.0, 33.0] },
];
const GOAL_TARGETS = {
  健康增重: { cal: 2500, protein: 90, carbs: 300, fat: 70, fiber: 25 },
  减脂塑形: { cal: 1900, protein: 100, carbs: 200, fat: 55, fiber: 28 },
  均衡饮食: { cal: 2200, protein: 75, carbs: 280, fat: 65, fiber: 25 },
  增肌增重: { cal: 2800, protein: 120, carbs: 350, fat: 80, fiber: 30 },
};
const GOAL_TYPE_LIST = Object.keys(GOAL_TARGETS);
// 三餐占比合计 1.07 餐/人·天（= 4278 / 4000）
const MEAL_PROB = [
  { type: '早餐', p: 0.268, share: 0.25, time: '07:30:00' },
  { type: '午餐', p: 0.452, share: 0.40, time: '12:00:00' },
  { type: '晚餐', p: 0.350, share: 0.35, time: '18:00:00' },
];

const isoDate = (d) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

function dateList(days) {
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(isoDate(d));
  }
  return out;
}

// ─────────────────────────── 学生 ───────────────────────────
function buildStudents(opts, rnd) {
  const students = [];
  const usedIds = new Set();

  // ① 6 名演示学生：与现有 API / 小程序账号完全一致
  Object.keys(DATA.studentProfiles).forEach(function (k) {
    const p = DATA.studentProfiles[k];
    const today = DATA.todayNutritionStore[k] || {};
    const meta = DATA.students[parseInt(k, 10)] || {};
    students.push({
      id: p.id,
      account: 'stu' + p.id,
      demoKey: k,
      name: p.name,
      gender: p.gender || meta.gender || '男',
      age: p.age || meta.age || 20,
      college: p.college,
      avatar: p.avatar,
      dietType: p.diet,
      height: p.height,
      weight: p.weight,
      bmi: p.bmi,
      goalType: p.goal,
      level: p.level,
      checkDays: p.checkDays,
      avgScore: p.avgScore,
      allergies: p.allergyList || [],
      goal: {
        cal: today.caloriesTarget || 2200,
        protein: today.proteinTarget || 75,
        carbs: today.carbsTarget || 280,
        fat: today.fatTarget || 65,
        fiber: today.fiberTarget || 25,
      },
      today: today, // 演示学生「今日」沿用原 Mock，保证与现有接口一致
      isDemo: true,
    });
    usedIds.add(p.id);
  });

  // ② 其余学生：按目标分布随机生成
  const synthetic = Math.max(0, opts.students - students.length);
  const fiberBands = assignBuckets(rnd, synthetic, FIBER_BAND.map((b) => b.weight));
  const scoreBands = assignBuckets(rnd, synthetic, SCORE_BAND.map((b) => b.weight));
  const bmiBands = assignBuckets(rnd, synthetic, BMI_BAND.map((b) => b.weight));
  const fatOverBands = assignBuckets(rnd, synthetic, [FAT_OVER.over, FAT_OVER.ok]);

  let sid = 2023010001;
  for (let i = 0; i < synthetic; i++) {
    while (usedIds.has(sid)) sid++;
    usedIds.add(sid);

    const gender = rnd() < 0.52 ? '男' : '女';
    const bBmi = bmiBands[i];
    const bmi = round1(between(rnd, BMI_BAND[bBmi].bmi[0], BMI_BAND[bBmi].bmi[1]));
    const height = Math.round(gender === '男' ? between(rnd, 165, 185) : between(rnd, 152, 172));
    const weight = round1((bmi * height * height) / 10000);
    // 偏瘦/正常 → 增重或均衡；偏重/肥胖 → 减脂
    const goalType =
      GOAL_TYPE_LIST[Math.floor(rnd() * 2) + (bBmi >= 2 ? 1 : bBmi === 0 ? 0 : 2)];

    students.push({
      id: sid,
      account: 'stu' + sid,
      demoKey: null,
      name: pick(rnd, SURNAMES) + pick(rnd, GIVEN),
      gender: gender,
      age: Math.round(between(rnd, 18, 23)),
      college: pick(rnd, COLLEGES),
      avatar: pick(rnd, gender === '男' ? AVATARS_M : AVATARS_F),
      dietType: pick(rnd, DIET_TYPES),
      height: height,
      weight: weight,
      bmi: bmi,
      goalType: goalType,
      level: 1 + Math.floor(rnd() * 8),
      checkDays: Math.round(between(rnd, 0, 90)),
      avgScore: 0, // 稍后由营养数据回填
      allergies: rnd() < 0.22 ? [pick(rnd, ALLERGENS)] : [],
      goal: GOAL_TARGETS[goalType],
      today: null,
      isDemo: false,
      fiberBand: fiberBands[i],
      scoreBand: scoreBands[i],
      bmiBand: bBmi,
      fatOver: fatOverBands[i] === 0,
    });
    sid++;
  }

  // 演示学生档位：由其真实「今日」数据反推
  students.forEach(function (s) {
    if (!s.isDemo) return;
    const t = s.today || {};
    const fiberRatio = (t.fiber || 0) / (s.goal.fiber || 25);
    s.fiberBand = fiberRatio < 0.4 ? 0 : fiberRatio < 0.8 ? 1 : 2;
    const sc = t.score || 80;
    s.scoreBand = sc >= 80 ? 0 : sc >= 70 ? 1 : sc >= 60 ? 2 : 3;
    s.bmiBand = s.bmi < 18.5 ? 0 : s.bmi < 24 ? 1 : s.bmi < 28 ? 2 : 3;
    s.fatOver = (t.fat || 0) > (s.goal.fat || 65);
  });

  return students;
}

// ─────────────────── 营养汇总（nutrition_daily） ───────────────────
function buildNutritionDays(student, dates, rnd) {
  const scoreSpec = SCORE_BAND[student.scoreBand];
  const fiberSpec = FIBER_BAND[student.fiberBand];
  const g = student.goal;
  const week = student.isDemo && student.demoKey !== null
    ? (DATA.nutritionData[student.demoKey] || {}).weekCalories
    : null;

  return dates.map(function (date, idx) {
    const isToday = idx === dates.length - 1;

    // 演示学生「今日」直接用原 Mock 值
    if (student.isDemo && isToday && student.today && student.today.calories) {
      const t = student.today;
      return {
        student_id: student.id, stat_date: date,
        calories: t.calories, protein: t.protein, carbs: t.carbs, fat: t.fat, fiber: t.fiber,
        score: t.score || 80, checked: t.checked ? 1 : 0,
      };
    }

    // 演示学生近 7 日热量沿用 weekCalories，保证大屏折线一致
    const useWeek = week && week.length === 7 && idx >= dates.length - 7;
    const calories = useWeek
      ? week[idx - (dates.length - 7)]
      : Math.round(g.cal * between(rnd, scoreSpec.calRatio[0], scoreSpec.calRatio[1]));

    const proRatio =
      student.scoreBand === 0 ? between(rnd, 0.9, 1.25)
      : student.scoreBand === 1 ? between(rnd, 0.75, 1.0)
      : between(rnd, 0.5, 0.85);
    const fatRatio = student.fatOver
      ? between(rnd, 1.05, 1.75)
      : between(rnd, 0.60, 0.98);

    return {
      student_id: student.id, stat_date: date,
      calories: calories,
      protein: round1(g.protein * proRatio),
      carbs: round1(g.carbs * between(rnd, 0.8, 1.15)),
      fat: round1(g.fat * fatRatio),
      fiber: round1(g.fiber * between(rnd, fiberSpec.fiberRatio[0], fiberSpec.fiberRatio[1])),
      score: Math.round(between(rnd, scoreSpec.score[0], scoreSpec.score[1])),
      checked: rnd() < 0.581 ? 1 : 0, // 打卡率 58.1%
    };
  });
}

// ─────────────── 用餐明细（meal_record + meal_record_item） ───────────────
let nextRecordId = 0;
function buildMeals(student, dates, dishes, rnd) {
  const records = [];
  const items = [];
  const byName = {};
  dishes.forEach((d) => (byName[d.name] = d));

  dates.forEach(function (date) {
    MEAL_PROB.forEach(function (mp) {
      if (rnd() > mp.p) return;
      const pool = (MEAL_FIT[mp.type] || []).map((n) => byName[n]).filter(Boolean);
      if (!pool.length) return;
      const nPick = Math.min(1 + Math.floor(rnd() * 3), pool.length);
      const chosen = shuffle(rnd, pool.slice()).slice(0, nPick);
      const mealCal = student.goal.cal * mp.share;
      const id = ++nextRecordId;

      let totalCal = 0, totalProtein = 0, totalCost = 0;
      chosen.forEach(function (dish) {
        const qty = Math.max(0.5, round1(mealCal / chosen.length / dish.cal));
        const cal = Math.round(dish.cal * qty);
        const protein = round1(dish.protein * qty);
        totalCal += cal;
        totalProtein += protein;
        totalCost += dish.price * qty;
        items.push({
          record_id: id,
          dish_id: dish.id,
          meal_date: date,
          qty: qty,
          cal: cal,
          protein: protein,
          fat: round1(dish.fat * qty),
          carbs: round1(dish.carbs * qty),
          fiber: round1(dish.fiber * qty),
        });
      });

      records.push({
        id: id,
        student_id: student.id,
        meal_date: date,
        meal_type: mp.type,
        meal_time: mp.time,
        total_cal: totalCal,
        total_protein: round1(totalProtein),
        total_cost: round2(totalCost),
        source: 1,
      });
    });
  });

  return { records: records, items: items };
}

// ─────────────── 菜品每日销量（dish_sales_daily） ───────────────
function buildSales(dates, dishes, rnd) {
  const base = {};
  DATA.forecastData.forEach((f) => (base[f.dish] = f.qty));
  const rows = [];
  dates.forEach(function (date) {
    const day = new Date(date).getDay();
    const weekend = day === 0 || day === 6;
    dishes.forEach(function (dish) {
      const b = base[dish.name] || 300;
      rows.push({
        dish_id: dish.id,
        stat_date: date,
        qty: Math.max(1, Math.round(b * (weekend ? 0.62 : 1) * between(rnd, 0.88, 1.12))),
      });
    });
  });
  return rows;
}

// ─────────────────────────── SQL 拼接 ───────────────────────────
function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function insertStatements(table, columns, rows, chunkSize) {
  const out = [];
  const size = chunkSize || 200;
  for (let i = 0; i < rows.length; i += size) {
    const values = rows
      .slice(i, i + size)
      .map((r) => '(' + columns.map((c) => sqlValue(r[c])).join(', ') + ')')
      .join(',\n  ');
    out.push('INSERT INTO ' + table + ' (' + columns.join(', ') + ') VALUES\n  ' + values + ';');
  }
  return out;
}

const COLS = {
  admin: ['username', 'password_hash', 'name', 'role'],
  student: ['id', 'account', 'password_hash', 'name', 'gender', 'age', 'college_id', 'avatar', 'diet_type', 'height_cm', 'weight_kg', 'bmi'],
  goal: ['student_id', 'goal_type', 'cal_target', 'protein_target', 'carbs_target', 'fat_target', 'fiber_target'],
  allergen: ['student_id', 'allergen_id'],
  remind: ['student_id', 'meal_type', 'enabled', 'remind_time'],
  game: ['student_id', 'level', 'coin', 'theme', 'check_days', 'avg_score'],
  dish: ['id', 'canteen_id', 'name', 'emoji', 'category', 'cal', 'protein', 'fat', 'carbs', 'fiber', 'price', 'description'],
  dishTag: ['dish_id', 'tag_id'],
  dishAllergen: ['dish_id', 'allergen_id'],
  nutrition: ['student_id', 'stat_date', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'score', 'checked'],
  meal: ['id', 'student_id', 'meal_date', 'meal_type', 'meal_time', 'total_cal', 'total_protein', 'total_cost', 'source'],
  mealItem: ['record_id', 'dish_id', 'meal_date', 'qty', 'cal', 'protein', 'fat', 'carbs', 'fiber'],
  sales: ['dish_id', 'stat_date', 'qty'],
};

// ─────────────────────────── 主流程 ───────────────────────────
async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.mode === 'out' && !opts.explicitStudents) {
    opts.students = Object.keys(DATA.studentProfiles).length;
    console.log('[提示] --out 模式默认只导出演示学生，如需全量请显式指定 --students=N\n');
  }
  if (opts.mode === 'out' && opts.students > 1000) {
    console.log('[警告] 学生数 ' + opts.students + ' 会让 SQL 文件非常大（建议用 --exec 直连入库）\n');
  }

  const rnd = makeRng(opts.seed);
  const dishes = buildDishes();
  const students = buildStudents(opts, rnd);
  const datesSummary = dateList(opts.daysSummary);
  const datesMeals = dateList(opts.daysMeals);
  const demoStudents = students.filter((s) => s.isDemo);

  console.log('══════ 智慧膳系统 · 种子数据生成 ══════');
  console.log('  模式       : ' + opts.mode);
  console.log('  学生总数   : ' + students.length + '（演示学生 ' + demoStudents.length + '）');
  console.log('  汇总天数   : ' + opts.daysSummary + ' 天（' + datesSummary[0] + ' ~ ' + datesSummary[datesSummary.length - 1] + '）');
  console.log('  明细天数   : ' + opts.daysMeals + ' 天');
  console.log('  菜品数     : ' + dishes.length);
  console.log('  随机种子   : ' + opts.seed);

  // 生成
  let nutritionRows = [];
  let mealRecords = [];
  let mealItems = [];
  students.forEach(function (s) {
    nutritionRows = nutritionRows.concat(buildNutritionDays(s, datesSummary, rnd));
    const m = buildMeals(s, datesMeals, dishes, rnd);
    mealRecords = mealRecords.concat(m.records);
    mealItems = mealItems.concat(m.items);
  });

  // 合成学生的 avgScore 由营养数据回填
  const scoreSum = {};
  nutritionRows.forEach(function (r) {
    scoreSum[r.student_id] = (scoreSum[r.student_id] || 0) + r.score;
  });
  students.forEach(function (s) {
    if (!s.isDemo) {
      s.avgScore = Math.round(scoreSum[s.id] / Math.max(1, opts.daysSummary));
    }
  });

  const salesRows = buildSales(datesSummary, dishes, rnd);

  const studentRows = students.map((s) => ({
    id: s.id, account: s.account, password_hash: nextStudentHash(), name: s.name,
    gender: s.gender, age: s.age, college_id: collegeIdOf(s.college), avatar: s.avatar,
    diet_type: s.dietType, height_cm: s.height, weight_kg: s.weight, bmi: s.bmi,
  }));
  const goalRows = students.map((s) => ({
    student_id: s.id, goal_type: s.goalType, cal_target: s.goal.cal, protein_target: s.goal.protein,
    carbs_target: s.goal.carbs, fat_target: s.goal.fat, fiber_target: s.goal.fiber,
  }));
  const allergenRows = [];
  students.forEach(function (s) {
    s.allergies.forEach(function (a) {
      const idx = ALLERGENS.indexOf(a);
      if (idx >= 0) allergenRows.push({ student_id: s.id, allergen_id: idx + 1 });
    });
  });
  const remindRows = [];
  students.forEach(function (s) {
    [['早餐', '07:30:00'], ['午餐', '11:30:00'], ['晚餐', '17:30:00']].forEach(function (m) {
      remindRows.push({ student_id: s.id, meal_type: m[0], enabled: 1, remind_time: m[1] });
    });
  });
  const gameRows = students.map((s) => ({
    student_id: s.id, level: s.level, coin: 50 + (s.id % 900), theme: 'night',
    check_days: s.checkDays, avg_score: s.avgScore,
  }));
  const dishRows = dishes.map((d) => ({
    id: d.id, canteen_id: d.canteenId, name: d.name, emoji: d.emoji, category: d.category,
    cal: d.cal, protein: d.protein, fat: d.fat, carbs: d.carbs, fiber: d.fiber,
    price: d.price, description: d.description,
  }));
  const dishTagRows = dishes.flatMap((d) => d.tags.map((t) => ({ dish_id: d.id, tag_id: TAGS.indexOf(t) + 1 })));
  const dishAllergenRows = dishes.flatMap((d) => d.allergens.map((a) => ({ dish_id: d.id, allergen_id: ALLERGENS.indexOf(a) + 1 })));
  const adminRows = [{ username: 'admin', password_hash: hashPassword('admin123'), name: '管理员', role: 'admin' }];

  // ── 自检 ──
  const lastDate = datesSummary[datesSummary.length - 1];
  const todayRows = nutritionRows.filter((r) => r.stat_date === lastDate);
  const pct = (n) => ((n / todayRows.length) * 100).toFixed(1) + '%';
  const fiberBands = [
    todayRows.filter((r) => r.fiber < 10).length,
    todayRows.filter((r) => r.fiber >= 10 && r.fiber < 20).length,
    todayRows.filter((r) => r.fiber >= 20).length,
  ];
  const scoreBands = [
    todayRows.filter((r) => r.score >= 80).length,
    todayRows.filter((r) => r.score >= 70 && r.score < 80).length,
    todayRows.filter((r) => r.score >= 60 && r.score < 70).length,
    todayRows.filter((r) => r.score < 60).length,
  ];
  const bmiBands = [
    students.filter((s) => s.bmi < 18.5).length,
    students.filter((s) => s.bmi >= 18.5 && s.bmi < 24).length,
    students.filter((s) => s.bmi >= 24 && s.bmi < 28).length,
    students.filter((s) => s.bmi >= 28).length,
  ];
  const meanCal = Math.round(todayRows.reduce((a, r) => a + r.calories, 0) / todayRows.length);
  const meanRec = Math.round(students.reduce((a, s) => a + s.goal.cal, 0) / students.length);
  const fatOver = Math.round((todayRows.filter((r, i) => r.fat > students[i].goal.fat).length / todayRows.length) * 100);

  console.log('\n────── 生成量 ──────');
  [
    ['admin_user', adminRows], ['student', studentRows], ['student_goal', goalRows],
    ['student_allergen', allergenRows], ['remind_setting', remindRows],
    ['student_game_profile', gameRows], ['dish', dishRows], ['dish_tag', dishTagRows],
    ['dish_allergen', dishAllergenRows], ['nutrition_daily', nutritionRows],
    ['meal_record', mealRecords], ['meal_record_item', mealItems], ['dish_sales_daily', salesRows],
  ].forEach(([t, r]) => console.log('  ' + t.padEnd(22) + r.length));

  console.log('\n────── 分布自检（' + lastDate + '） ──────');
  console.log('  纤维分档  <10g ' + pct(fiberBands[0]) + ' / 10-20g ' + pct(fiberBands[1])
    + ' / >=20g ' + pct(fiberBands[2]) + '    目标 28 / 44 / 28');
  console.log('  评分分布  80+ ' + pct(scoreBands[0]) + ' / 70-79 ' + pct(scoreBands[1])
    + ' / 60-69 ' + pct(scoreBands[2]) + ' / <60 ' + pct(scoreBands[3]) + '    目标 36 / 27 / 18 / 19');
  console.log('  BMI 分布  偏瘦 ' + pct(bmiBands[0]) + ' / 正常 ' + pct(bmiBands[1])
    + ' / 偏重 ' + pct(bmiBands[2]) + ' / 肥胖 ' + pct(bmiBands[3]) + '    目标 12 / 64.6 / 17.6 / 5.9');
  console.log('  平均热量  ' + meanCal + ' kcal（推荐均值 ' + meanRec + '，超标 '
    + (((meanCal / meanRec - 1) * 100).toFixed(0)) + '%）    大屏口径 2340 / 2025 = +16%');
  console.log('  脂肪超标率 ' + fatOver + '%    大屏口径 68%');
  console.log('  日均就餐   ' + Math.round(mealRecords.length / opts.daysMeals) + ' 人次    大屏口径 4278');

  // ── 输出 ──
  if (opts.mode === 'dry-run') {
    console.log('\n[dry-run] 未连接数据库、未写文件。加 --out=... 或 --exec 以实际输出。');
    return;
  }

  if (opts.mode === 'out') {
    const L = [];
    L.push('-- 智慧膳系统 · 种子数据（由 scripts/seed.js 生成，请勿手工编辑）');
    L.push('-- 学生 ' + students.length + ' 名 / 汇总 ' + opts.daysSummary + ' 天 / 明细 ' + opts.daysMeals + ' 天');
    L.push('USE zhipan_canteen;');
    L.push('SET FOREIGN_KEY_CHECKS = 0;');
    [
      'game_chest_log', 'student_game_profile', 'remind_setting', 'checkin_record',
      'nutrition_daily', 'meal_record_item', 'meal_record', 'dish_sales_daily',
      'dish_tag', 'dish_allergen', 'dish', 'student_allergen', 'student_goal',
      'student', 'admin_user',
    ].forEach((t) => L.push('TRUNCATE TABLE ' + t + ';'));
    L.push('SET FOREIGN_KEY_CHECKS = 1;');

    L.push(insertStatements('admin_user', COLS.admin, adminRows).join('\n'));
    L.push(insertStatements('student', COLS.student, studentRows, 100).join('\n'));
    L.push(insertStatements('student_goal', COLS.goal, goalRows).join('\n'));
    if (allergenRows.length) L.push(insertStatements('student_allergen', COLS.allergen, allergenRows).join('\n'));
    L.push(insertStatements('remind_setting', COLS.remind, remindRows).join('\n'));
    L.push(insertStatements('student_game_profile', COLS.game, gameRows).join('\n'));
    L.push(insertStatements('dish', COLS.dish, dishRows).join('\n'));
    if (dishTagRows.length) L.push(insertStatements('dish_tag', COLS.dishTag, dishTagRows).join('\n'));
    if (dishAllergenRows.length) L.push(insertStatements('dish_allergen', COLS.dishAllergen, dishAllergenRows).join('\n'));
    L.push(insertStatements('nutrition_daily', COLS.nutrition, nutritionRows).join('\n'));
    if (mealRecords.length) {
      L.push(insertStatements('meal_record', COLS.meal, mealRecords, 100).join('\n'));
      L.push(insertStatements('meal_record_item', COLS.mealItem, mealItems, 100).join('\n'));
    }
    L.push(insertStatements('dish_sales_daily', COLS.sales, salesRows).join('\n'));

    const outPath = path.join(ROOT, opts.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, L.join('\n\n') + '\n', 'utf8');
    console.log('\n[out] 已写出 ' + outPath + '（' + (fs.statSync(outPath).size / 1024).toFixed(1) + ' KB）');
    return;
  }

  // ── exec ──
  const db = require('../config/db');
  let health;
  try {
    health = await db.healthCheck();
  } catch (e) {
    console.error('\n[错误] 无法连接数据库：' + e.message);
    console.error('       1) 确认已安装并启动 MySQL 8');
    console.error('       2) 检查 backend/.env 的 DB_* 配置');
    console.error('       3) 先执行建表：mysql -u root -p < sql/schema.sql');
    process.exit(1);
  }
  console.log('\n[exec] 已连接 ' + health.database + '（MySQL ' + health.version + '）');

  const conn = await db.pool.getConnection();
  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    if (opts.reset) {
      for (const t of [
        'game_chest_log', 'student_game_profile', 'remind_setting', 'checkin_record',
        'nutrition_daily', 'meal_record_item', 'meal_record', 'dish_sales_daily',
        'dish_tag', 'dish_allergen', 'dish', 'student_allergen', 'student_goal',
        'student', 'admin_user',
      ]) {
        await conn.query('TRUNCATE TABLE ' + t);
      }
      console.log('[exec] 已清空数据表');
    }

    const bulk = async (label, table, columns, rows, size) => {
      const chunk = size || 500;
      for (let i = 0; i < rows.length; i += chunk) {
        await conn.query(
          'INSERT INTO ' + table + ' (' + columns.join(',') + ') VALUES ?',
          [rows.slice(i, i + chunk).map((r) => columns.map((c) => r[c]))]
        );
      }
      console.log('  ✓ ' + String(label).padEnd(20) + rows.length + ' 行');
    };

    await bulk('admin_user', 'admin_user', COLS.admin, adminRows);
    await bulk('student', 'student', COLS.student, studentRows);
    await bulk('student_goal', 'student_goal', COLS.goal, goalRows);
    if (allergenRows.length) await bulk('student_allergen', 'student_allergen', COLS.allergen, allergenRows);
    await bulk('remind_setting', 'remind_setting', COLS.remind, remindRows);
    await bulk('student_game_profile', 'student_game_profile', COLS.game, gameRows);
    await bulk('dish', 'dish', COLS.dish, dishRows);
    if (dishTagRows.length) await bulk('dish_tag', 'dish_tag', COLS.dishTag, dishTagRows);
    if (dishAllergenRows.length) await bulk('dish_allergen', 'dish_allergen', COLS.dishAllergen, dishAllergenRows);
    await bulk('nutrition_daily', 'nutrition_daily', COLS.nutrition, nutritionRows);
    await bulk('meal_record', 'meal_record', COLS.meal, mealRecords);
    await bulk('meal_record_item', 'meal_record_item', COLS.mealItem, mealItems);
    await bulk('dish_sales_daily', 'dish_sales_daily', COLS.sales, salesRows);

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n[exec] 完成。示例校验：');
    console.log('  SELECT COUNT(*) FROM student;                 -- 应为 ' + students.length);
    console.log('  SELECT COUNT(*) FROM meal_record;              -- 应为 ' + mealRecords.length);
    console.log('  SELECT * FROM v_fiber_distribution;            -- 纤维分档（应接近 28/44/28）');
    console.log('  SELECT * FROM v_group_nutrition_ratio;         -- 群体达标率（热量应约 116）');
    console.log('  演示学生登录：stu2023010042 / 123456；管理员：admin / admin123');
  } catch (e) {
    console.error('\n[错误] 写入失败：' + e.message);
    process.exitCode = 1;
  } finally {
    conn.release();
    await db.close();
  }
}

main().catch(function (e) {
  console.error('种子脚本异常：', e);
  process.exit(1);
});
