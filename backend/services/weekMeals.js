// ============================================
// 智慧膳系统 · 周用餐记录（内存存储）
// ============================================
// 说明：项目原有数据只有「当天三餐」与 7 个汇总热量数字，
// 没有「某学生本周吃了哪些菜」。本模块补上这块：
//   ① 用全校菜单 weeklyMenu + 学生饮食禁忌，程序化生成一周用餐记录（确定性，重启不变）
//   ② 支持学生自己记餐（手动 / 拍照识别）追加进同一份记录
// 所有营养数值都来自 foodDB（确定性），不经过模型。

const { weeklyMenu, foodDB, studentProfiles, todayNutritionStore } = require('../models/data');
const { isSafeForStudent } = require('../models/dishRules');

// ─── 菜品名 → foodDB 索引 ───────────────────────
const BY_NAME = {};
Object.values(foodDB).forEach((d) => { if (!BY_NAME[d.name]) BY_NAME[d.name] = d; });

function findDish(name) {
  if (!name) return null;
  if (BY_NAME[name]) return BY_NAME[name];
  const base = String(name).replace(/（[^）]*）/g, '').replace(/\+.*$/, '').trim();
  return BY_NAME[base] || null;
}

// ─── 确定性伪随机（同一学生每次生成结果一致）────
function makeRnd(seed) {
  let s = (seed >>> 0) || 1;
  return function () {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// ─── 餐次规则：每餐从菜单里挑哪些类别的菜 ────────
const MEAL_RECIPE = {
  早餐: { time: '07:30', want: ['粥品', '小吃', '饮品'], min: 2 },
  午餐: { time: '12:05', want: ['主食', '荤菜', '荤菜', '素菜', '汤品'], min: 4 },
  晚餐: { time: '18:10', want: ['主食', '荤菜', '素菜', '汤品'], min: 3 },
};

const MEAL_TYPES = ['早餐', '午餐', '晚餐'];

// ─── 取某天某一餐的候选菜品（只取该餐次供应的，且已过安全过滤）──
function candidatesOfMeal(dayData, mealType, student) {
  const md = (dayData.meals || []).find((m) => m.meal === mealType);
  if (!md) return null;               // 这天不供应这一餐（如周日只有晚餐）
  const picked = new Set();
  const out = [];
  md.lines.forEach((l) => {
    l.items.forEach((item) => {
      if (picked.has(item)) return;
      const dish = findDish(item);
      if (!dish) return;
      picked.add(item);
      if (isSafeForStudent(dish, student).ok) out.push(dish);
    });
  });
  return out;
}

// ─── 生成一个学生的整周记录 ─────────────────────
function buildStudentWeek(studentId) {
  const profile = studentProfiles[studentId] || {};
  const store = todayNutritionStore[studentId] || {};
  const rnd = makeRnd(1000 + studentId * 7919);
  const days = [];

  weeklyMenu.days.forEach((dayData, di) => {
    const meals = [];
    const dayUsed = new Set();   // 同一天内不重复同一道菜

    MEAL_TYPES.forEach((mealType) => {
      const recipe = MEAL_RECIPE[mealType];
      const safe = candidatesOfMeal(dayData, mealType, profile);
      if (!safe || !safe.length) return;   // 这天没有这一餐，跳过
      const chosen = [];
      const used = new Set();

      let want = recipe.want.slice();

      // 先定主食：若主食本身已是「一份吃饱」的整餐（盖浇饭/炒饭/面/米线等），
      // 则减掉一道荤菜，避免一顿里出现两个主食 + 两道硬菜的超量搭配
      if (mealType !== '早餐') {
        const staples = safe.filter((d) => d.cat === '主食' && !dayUsed.has(d.id) && !used.has(d.id));
        if (staples.length) {
          const staple = shuffle(staples, rnd)[0];
          used.add(staple.id); dayUsed.add(staple.id);
          chosen.push({ dish: staple, qty: 1 });
          if (/盖浇饭|炒饭|拌饭|炒面|炒刀削|米线|馄饨|水饺|蒸饺|面$/.test(staple.name)) {
            const i = want.indexOf('荤菜');
            if (i >= 0) want.splice(i, 1);
          }
        }
        want = want.filter((c) => c !== '主食');
      }

      want.forEach((cat) => {
        const fresh = safe.filter((d) => d.cat === cat && !used.has(d.id) && !dayUsed.has(d.id));
        const anySameCat = safe.filter((d) => d.cat === cat && !used.has(d.id));
        const pool = fresh.length ? fresh : anySameCat;
        if (pool.length) {
          const pick = shuffle(pool, rnd)[0];
          used.add(pick.id); dayUsed.add(pick.id);
          chosen.push({ dish: pick, qty: 1 });
        }
      });

      // 补位：禁忌严格的学生缺少某些类别，按「蛋白质优先」补足到该餐最低道数
      // （排除汤品/饮品这类低热量项，避免用饮料凑数）
      const minCount = recipe.min || 3;
      let guard = 0;
      while (chosen.length < minCount && guard++ < 10) {
        const pool = safe
          .filter((d) => !used.has(d.id) && !dayUsed.has(d.id)
            && d.cat !== '饮品' && !(mealType !== '早餐' && d.cat === '汤品'));
        if (!pool.length) break;
        const top = pool.slice().sort((a, b) => b.protein - a.protein).slice(0, 8);
        const pick = shuffle(top, rnd)[0];
        used.add(pick.id); dayUsed.add(pick.id);
        chosen.push({ dish: pick, qty: 1 });
      }

      if (!chosen.length) return;

      let cal = 0, protein = 0, fat = 0, carbs = 0, fiber = 0;
      const items = chosen.map((c) => {
        cal += c.dish.cal * c.qty;
        protein += c.dish.protein * c.qty;
        fat += c.dish.fat * c.qty;
        carbs += c.dish.carbs * c.qty;
        fiber += c.dish.fiber * c.qty;
        return {
          dishId: c.dish.id, name: c.dish.name, emoji: c.dish.emoji, cat: c.dish.cat,
          qty: c.qty, cal: c.dish.cal, protein: c.dish.protein, fat: c.dish.fat,
          carbs: c.dish.carbs, fiber: c.dish.fiber,
        };
      });

      meals.push({
        meal: mealType,
        time: recipe.time,
        items,
        totalCal: Math.round(cal),
        totalProtein: Math.round(protein * 10) / 10,
        totalFat: Math.round(fat * 10) / 10,
        totalCarbs: Math.round(carbs * 10) / 10,
        totalFiber: Math.round(fiber * 10) / 10,
      });
    });

    const sum = (k) => Math.round(meals.reduce((s, m) => s + m[k], 0) * 10) / 10;
    days.push({
      date: dayData.date,
      day: dayData.day,
      weekday: dayData.day.replace('星期', '周'),
      meals,
      totalCal: Math.round(sum('totalCal')),
      totalProtein: sum('totalProtein'),
      totalFat: sum('totalFat'),
      totalCarbs: sum('totalCarbs'),
      totalFiber: sum('totalFiber'),
    });
  });

  return {
    studentId,
    week: weeklyMenu.week,
    dateRange: weeklyMenu.dateRange,
    goalType: store.goalType || '均衡饮食',
    diet: profile.diet || '无限制',
    allergyList: profile.allergyList || [],
    targets: {
      cal: store.caloriesTarget || 2000,
      protein: store.proteinTarget || 65,
      carbs: store.carbsTarget || 260,
      fat: store.fatTarget || 60,
      fiber: store.fiberTarget || 25,
    },
    days,
  };
}

// ─── 内存存储（进程级缓存）──────────────────────
const WEEK_STORE = {};   // studentId -> week 对象
const LOG_STORE = {};    // studentId -> [自记餐次]

function getWeek(studentId) {
  const id = parseInt(studentId, 10);
  if (!WEEK_STORE[id]) WEEK_STORE[id] = buildStudentWeek(id);
  const week = WEEK_STORE[id];
  // 合并「学生自己记的餐」
  const logs = LOG_STORE[id] || [];
  if (!logs.length) return week;
  return { ...week, days: mergeLogs(week.days, logs) };
}

function mergeLogs(days, logs) {
  return days.map((day) => {
    const mine = logs.filter((l) => l.date === day.date);
    if (!mine.length) return day;
    const meals = day.meals.slice();
    mine.forEach((log) => {
      const idx = meals.findIndex((m) => m.meal === log.meal);
      const entry = {
        meal: log.meal,
        time: log.time || '--:--',
        items: log.items,
        totalCal: log.totalCal,
        totalProtein: log.totalProtein,
        totalFat: log.totalFat,
        totalCarbs: log.totalCarbs,
        totalFiber: log.totalFiber,
        self: true,
      };
      if (idx >= 0) meals[idx] = entry; else meals.push(entry);
    });
    const sum = (k) => Math.round(meals.reduce((s, m) => s + (m[k] || 0), 0) * 10) / 10;
    return {
      ...day, meals,
      totalCal: Math.round(sum('totalCal')),
      totalProtein: sum('totalProtein'),
      totalFat: sum('totalFat'),
      totalCarbs: sum('totalCarbs'),
      totalFiber: sum('totalFiber'),
    };
  });
}

/**
 * 学生自己记一餐（手动选菜或拍照识别结果）
 * @param {number} studentId
 * @param {{date:string, meal:string, dishes:Array<{name:string, qty?:number}>}} payload
 * @returns {{ok:boolean, error?:string, meal?:object}}
 */
function addMeal(studentId, payload) {
  const id = parseInt(studentId, 10);
  const week = getWeek(id);
  const date = payload.date || (week.days[0] && week.days[0].date);
  const day = week.days.find((d) => d.date === date);
  if (!day) return { ok: false, error: '日期不在本周范围内：' + date };

  const dishes = payload.dishes || [];
  if (!dishes.length) return { ok: false, error: '至少需要一道菜' };

  const profile = studentProfiles[id] || {};
  const blocked = [];
  const items = [];

  dishes.forEach((d) => {
    const dish = findDish(d.name);
    if (!dish) { blocked.push({ name: d.name, reason: '菜品库中没有这道菜' }); return; }
    const safe = isSafeForStudent(dish, profile);
    if (!safe.ok) { blocked.push({ name: d.name, reason: safe.reason }); return; }
    const qty = typeof d.qty === 'number' && d.qty > 0 ? d.qty : 1;
    items.push({
      dishId: dish.id, name: dish.name, emoji: dish.emoji, cat: dish.cat, qty,
      cal: dish.cal, protein: dish.protein, fat: dish.fat, carbs: dish.carbs, fiber: dish.fiber,
    });
  });

  if (!items.length) {
    return { ok: false, error: '没有可记录的菜品', blocked };
  }

  const sum = (k) => Math.round(items.reduce((s, i) => s + (i[k] || 0) * (k === 'cal' ? i.qty : i.qty), 0) * 10) / 10;
  const log = {
    date,
    meal: payload.meal || '午餐',
    time: payload.time || '--:--',
    items,
    totalCal: Math.round(items.reduce((s, i) => s + i.cal * i.qty, 0)),
    totalProtein: sum('protein'),
    totalFat: sum('fat'),
    totalCarbs: sum('carbs'),
    totalFiber: sum('fiber'),
  };

  LOG_STORE[id] = (LOG_STORE[id] || []).filter((l) => !(l.date === date && l.meal === log.meal));
  LOG_STORE[id].push(log);
  return { ok: true, meal: log, blocked };
}

// ─── 周健康统计（确定性，供 AI 与降级模板共用）──
const FRIED_KEYWORDS = ['炸', '干锅', '红烧', '干煸', '脆皮', '香辣', '奥尔良', '粉蒸', '卤'];

// 单日健康评分（与周评分同一套规则，供「用餐记录」页逐日展示）
function dayScore(d, t) {
  let s = 100;
  const fatRatio = d.totalFat / t.fat;
  if (fatRatio > 1) s -= Math.round((fatRatio - 1) * 60);
  const fiberRatio = d.totalFiber / t.fiber;
  if (fiberRatio < 1) s -= Math.round((1 - fiberRatio) * 40);
  const proRatio = d.totalProtein / t.protein;
  if (proRatio < 0.9) s -= Math.round((1 - proRatio) * 30);
  const calRatio = d.totalCal / t.cal;
  if (calRatio > 1.15) s -= 12; else if (calRatio < 0.8) s -= 8;
  return Math.max(35, Math.min(98, Math.round(s)));
}

function computeWeekStats(studentId) {
  const week = getWeek(studentId);
  const t = week.targets;
  const days = week.days.filter((d) => d.meals.length);

  const avg = (k) => {
    if (!days.length) return 0;
    return Math.round((days.reduce((s, d) => s + d[k], 0) / days.length) * 10) / 10;
  };

  const daily = days.map((d) => ({
    date: d.date, day: d.day, weekday: d.weekday,
    cal: d.totalCal, protein: d.totalProtein, fat: d.totalFat,
    carbs: d.totalCarbs, fiber: d.totalFiber,
    calPct: Math.round((d.totalCal / t.cal) * 100),
    proteinPct: Math.round((d.totalProtein / t.protein) * 100),
    fatPct: Math.round((d.totalFat / t.fat) * 100),
    fiberPct: Math.round((d.totalFiber / t.fiber) * 100),
    score: dayScore(d, t),
  }));

  const countIf = (fn) => daily.filter(fn).length;
  const fiberMetDays = countIf((d) => d.fiberPct >= 80);
  const proteinMetDays = countIf((d) => d.proteinPct >= 80);
  const fatOverDays = countIf((d) => d.fatPct > 110);
  const calOverDays = countIf((d) => d.calPct > 110);
  const calLowDays = countIf((d) => d.calPct < 85);

  // 食物多样性
  const dishSet = new Set();
  let vegCount = 0, meatCount = 0, friedCount = 0, dishTotal = 0;
  week.days.forEach((d) => d.meals.forEach((m) => (m.items || []).forEach((i) => {
    dishSet.add(i.name);
    dishTotal++;
    if (i.cat === '荤菜') meatCount++;
    if (i.cat === '素菜' || i.cat === '汤品' || i.cat === '粥品') vegCount++;
    if (FRIED_KEYWORDS.some((k) => i.name.indexOf(k) >= 0)) friedCount++;
  })));

  const avgCal = avg('totalCal');
  const avgProtein = avg('totalProtein');
  const avgFat = avg('totalFat');
  const avgFiber = avg('totalFiber');

  // 健康评分（规则计算，AI 只做解释不参与打分）
  let score = 100;
  score -= Math.round(((avgFat / t.fat) - 1) * 60 > 0 ? ((avgFat / t.fat) - 1) * 60 : 0);
  score -= Math.round(((t.fiber - avgFiber) / t.fiber) * 40 > 0 ? ((t.fiber - avgFiber) / t.fiber) * 40 : 0);
  if (avgProtein < t.protein * 0.9) score -= Math.round((1 - avgProtein / t.protein) * 30);
  if (avgCal > t.cal * 1.15) score -= 12;
  if (avgCal < t.cal * 0.8) score -= 8;
  if (friedCount >= 6) score -= 8; else if (friedCount >= 4) score -= 4;
  if (dishSet.size < 12) score -= 6;
  score = Math.max(35, Math.min(98, score));

  const level = score >= 85 ? '优秀' : score >= 75 ? '良好' : score >= 60 ? '一般' : '需改善';

  const problems = [];
  if (avgFat > t.fat * 1.1) problems.push({ key: 'fat', title: '脂肪摄入偏高', detail: '日均 ' + avgFat + 'g，目标 ' + t.fat + 'g，超标 ' + Math.round((avgFat / t.fat - 1) * 100) + '%' });
  if (avgFiber < t.fiber * 0.8) problems.push({ key: 'fiber', title: '膳食纤维不足', detail: '日均 ' + avgFiber + 'g，目标 ' + t.fiber + 'g，达标 ' + Math.round((avgFiber / t.fiber) * 100) + '%' });
  if (avgProtein < t.protein * 0.9) problems.push({ key: 'protein', title: '蛋白质缺口', detail: '日均 ' + avgProtein + 'g，目标 ' + t.protein + 'g' });
  if (avgCal > t.cal * 1.12) problems.push({ key: 'cal', title: '热量超标', detail: '日均 ' + avgCal + 'kcal，目标 ' + t.cal + 'kcal' });
  if (avgCal < t.cal * 0.85) problems.push({ key: 'calLow', title: '热量摄入不足', detail: '日均 ' + avgCal + 'kcal，目标 ' + t.cal + 'kcal' });
  if (friedCount >= 5) problems.push({ key: 'fried', title: '重油烹饪偏多', detail: '本周红烧/干锅/油炸/粉蒸类菜品共 ' + friedCount + ' 道次' });

  const highlights = [];
  if (fiberMetDays >= 2) highlights.push({ key: 'fiber', title: '纤维达标 ' + fiberMetDays + ' 天', detail: '全周有 ' + fiberMetDays + '/7 天达到目标 80% 以上' });
  if (proteinMetDays >= 3) highlights.push({ key: 'protein', title: '蛋白摄入稳定', detail: '全周 ' + proteinMetDays + '/7 天蛋白质达标' });
  if (dishSet.size >= 18) highlights.push({ key: 'variety', title: '食物多样性好', detail: '本周共吃到 ' + dishSet.size + ' 种不同菜品' });
  if (vegCount > meatCount) highlights.push({ key: 'veg', title: '蔬菜占比健康', detail: '素菜/汤品 ' + vegCount + ' 道次，多于荤菜 ' + meatCount + ' 道次' });

  return {
    week: week.week,
    dateRange: week.dateRange,
    goalType: week.goalType,
    diet: week.diet,
    allergyList: week.allergyList,
    targets: t,
    daily,
    avg: { cal: avgCal, protein: avgProtein, fat: avgFat, carbs: avg('totalCarbs'), fiber: avgFiber },
    counts: {
      days: daily.length, fiberMetDays, proteinMetDays, fatOverDays, calOverDays, calLowDays,
      dishKinds: dishSet.size, dishTotal, vegCount, meatCount, friedCount,
    },
    score,
    level,
    problems,
    highlights,
  };
}

/** 供 AI 提示词使用的紧凑版（含具体菜品名，控制 token） */
function buildMealDigest(studentId) {
  const week = getWeek(studentId);
  return week.days.map((d) => ({
    date: d.date,
    weekday: d.weekday,
    meals: d.meals.map((m) => ({
      meal: m.meal,
      dishes: (m.items || []).map((i) => i.name),
      cal: m.totalCal,
    })),
    totalCal: d.totalCal,
    protein: d.totalProtein,
    fat: d.totalFat,
    fiber: d.totalFiber,
  }));
}

module.exports = {
  findDish,
  getWeek,
  addMeal,
  computeWeekStats,
  buildMealDigest,
  buildStudentWeek,
};
