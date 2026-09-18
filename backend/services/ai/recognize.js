// ============================================
// 智慧膳系统 · 拍照识别一餐（Vision）
// ============================================
// 边界：模型只输出「菜名 + 份量系数」，营养值一律由 foodDB 相乘得出；
//       识别结果还要再过一次安全硬过滤（模型无权绕过禁忌）

const { chatWithRetry, parseJson } = require('./client');
const { buildVisionSystem } = require('./prompts');
const weekMeals = require('../weekMeals');
const { foodDB, studentProfiles, weeklyMenu } = require('../../models/data');
const { isSafeForStudent } = require('../../models/dishRules');
const { isConfigured, config } = require('../../config/deepseek');

// 候选清单：本周菜单在售 + 已通过安全过滤（给模型的白名单）
function candidateNamesFor(student) {
  const names = [];
  const seen = new Set();
  weeklyMenu.days.forEach((d) => d.meals.forEach((m) => m.lines.forEach((l) => l.items.forEach((item) => {
    if (seen.has(item)) return;
    seen.add(item);
    const dish = weekMeals.findDish(item);
    if (!dish) return;
    if (isSafeForStudent(dish, student).ok) names.push(dish.name);
  }))));
  return names;
}

function nutritionOfDish(dish, portion) {
  const q = portion > 0 ? portion : 1;
  return {
    name: dish.name, emoji: dish.emoji, cat: dish.cat, portion: q, dishId: dish.id,
    cal: Math.round(dish.cal * q),
    protein: Math.round(dish.protein * q * 10) / 10,
    fat: Math.round(dish.fat * q * 10) / 10,
    carbs: Math.round(dish.carbs * q * 10) / 10,
    fiber: Math.round(dish.fiber * q * 10) / 10,
  };
}

/**
 * 识别餐盘照片
 * @param {number} studentId
 * @param {string} imageBase64 data URL 或纯 base64
 * @param {{commit?:boolean, date?:string, meal?:string}} opts
 */
async function recognizeMeal(studentId, imageBase64, opts) {
  const id = parseInt(studentId, 10);
  const profile = studentProfiles[id] || {};
  const candidates = candidateNamesFor(profile);

  if (!isConfigured()) {
    return { ok: false, source: 'fallback', error: 'not_configured', hint: '未配置 DEEPSEEK_API_KEY，可在小程序里手动勾选菜品' };
  }
  if (!imageBase64) {
    return { ok: false, error: 'missing_image' };
  }

  const url = String(imageBase64).indexOf('data:') === 0
    ? imageBase64
    : 'data:image/jpeg;base64,' + imageBase64;

  const res = await chatWithRetry({
    model: config.models.flash,
    tag: 'vision-meal',
    json: true,
    thinking: false,
    maxTokens: 800,
    messages: [
      { role: 'system', content: buildVisionSystem(candidates) },
      {
        role: 'user',
        content: [
          { type: 'text', text: '这是我这一餐的餐盘，请按约定 JSON 输出识别到的菜品。' },
          // 图片只能放在 user 消息里；detail:low 缩到 512×512 省 token
          { type: 'image_url', image_url: { url, detail: 'low' } },
        ],
      },
    ],
  });

  if (!res.ok) {
    return { ok: false, source: 'ai', error: res.error || 'ai_failed' };
  }

  const parsed = parseJson(res.content);
  if (!parsed || !Array.isArray(parsed.dishes)) {
    return { ok: false, source: 'ai', error: 'invalid_json', raw: (res.content || '').slice(0, 200) };
  }

  const blocked = [];
  const items = [];
  parsed.dishes.forEach((d) => {
    const dish = weekMeals.findDish(d && d.name);
    if (!dish) { blocked.push({ name: (d && d.name) || '未知', reason: '不在菜品库白名单内' }); return; }
    const safe = isSafeForStudent(dish, profile);
    if (!safe.ok) { blocked.push({ name: dish.name, reason: safe.reason }); return; }
    const portion = [0.5, 0.75, 1, 1.5].indexOf(d.portion) >= 0 ? d.portion : 1;
    items.push({ ...nutritionOfDish(dish, portion), confidence: typeof d.confidence === 'number' ? Math.round(d.confidence * 100) / 100 : null });
  });

  const totals = items.reduce((s, i) => ({
    cal: s.cal + i.cal, protein: Math.round((s.protein + i.protein) * 10) / 10,
    fat: Math.round((s.fat + i.fat) * 10) / 10,
    carbs: Math.round((s.carbs + i.carbs) * 10) / 10,
    fiber: Math.round((s.fiber + i.fiber) * 10) / 10,
  }), { cal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 });

  let committed = null;
  if (opts && opts.commit && items.length) {
    committed = weekMeals.addMeal(id, {
      date: opts.date,
      meal: opts.meal || '午餐',
      time: opts.time,
      dishes: items.map((i) => ({ name: i.name, qty: i.portion })),
    });
  }

  return {
    ok: true,
    source: 'ai',
    note: parsed.note || '',
    dishes: items,
    totals,
    blocked,
    committed: committed && committed.ok ? committed.meal : null,
    commitError: committed && !committed.ok ? committed.error : null,
    usage: res.usage || null,
  };
}

/** 手动记餐：把用户勾选的菜品写入周记录（同样过安全过滤） */
function logMeal(studentId, payload) {
  return weekMeals.addMeal(studentId, payload);
}

module.exports = { recognizeMeal, logMeal, candidateNamesFor };
