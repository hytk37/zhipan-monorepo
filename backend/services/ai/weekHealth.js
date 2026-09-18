// ============================================
// 智慧膳系统 · 周饮食健康分析（AI 编排 + 确定性降级）
// ============================================
// 流程：
//   1) 代码算出全部数值与问题项（computeWeekStats）—— 边界①
//   2) 把数值 + 真实菜品清单交给 DeepSeek，只让它写解释与建议
//   3) 输出过字段校验；不合法/超时/无 Key → 规则模板兜底 —— 边界③
// 结果按「学生 + 周」缓存，同一学生同一天不重复调用（成本控制）

const { chatWithRetry, parseJson, getUsage } = require('./client');
const { WEEK_HEALTH_SYSTEM, buildWeekHealthUser } = require('./prompts');
const weekMeals = require('../weekMeals');
const cal = require('../calendar');
const { studentProfiles } = require('../../models/data');
const { isConfigured, config } = require('../../config/deepseek');

const CACHE = new Map();          // key -> { at, data }
const CACHE_TTL_MS = 6 * 3600 * 1000;

// ─── 规则模板降级文案 ──────────────────────────
function topDishesBy(digest, filterFn, limit) {
  const counter = {};
  digest.forEach((d) => d.meals.forEach((m) => m.dishes.forEach((n) => {
    if (filterFn && !filterFn(n)) return;
    counter[n] = (counter[n] || 0) + 1;
  })));
  return Object.keys(counter).sort((a, b) => counter[b] - counter[a]).slice(0, limit || 3);
}

const FRIED_RE = /炸|干锅|红烧|干煸|脆皮|香辣|奥尔良|粉蒸|卤/;
const VEG_RE = /^(蒜蓉|清炒|炝炒|醋溜|凉拌|双椒|金钩|蜜汁|干焙)/;

function fallbackAnalysis(stats, digest, profile) {
  const name = profile.name || '同学';
  const fatTop = topDishesBy(digest, (n) => FRIED_RE.test(n), 3);
  const vegTop = topDishesBy(digest, (n) => VEG_RE.test(n), 3);

  const summary = [
    name + '，本周（' + stats.dateRange + '）你的饮食健康评分是 ' + stats.score + ' 分，属于「' + stats.level + '」。',
    '日均摄入 ' + stats.avg.cal + ' kcal（目标 ' + stats.targets.cal + '）、蛋白质 ' + stats.avg.protein + 'g'
      + '（目标 ' + stats.targets.protein + 'g）、脂肪 ' + stats.avg.fat + 'g（目标 ' + stats.targets.fat + 'g）、'
      + '膳食纤维 ' + stats.avg.fiber + 'g（目标 ' + stats.targets.fiber + 'g）。',
    stats.problems.length
      ? '主要问题是' + stats.problems.map((p) => p.title).join('、') + '。'
      : '各项指标都在合理范围内。',
    fatTop.length ? '本周重油做法出现较多的菜是' + fatTop.join('、') + '。' : '',
  ].filter(Boolean).join('');

  const problems = stats.problems.map((p) => ({
    title: p.title,
    detail: p.detail,
    suggestion: suggestFor(p.key, vegTop),
  }));

  const highlights = stats.highlights.length
    ? stats.highlights.map((h) => ({ title: h.title, detail: h.detail }))
    : [{ title: '记录完整', detail: '本周三餐记录齐全，坚持记录本身就是进步' }];

  // 挑「重油最多」和「搭配最好」的两天做逐餐点评
  const mealComments = [];
  const sorted = stats.daily.slice().sort((a, b) => b.fat - a.fat);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  if (worst) {
    const day = digest.find((d) => d.date === worst.date);
    mealComments.push({
      date: worst.date, meal: '全天',
      comment: '这天脂肪 ' + worst.fat + 'g，是本周最高。菜品以'
        + (day ? day.meals.map((m) => m.dishes.join('、')).join('；').slice(0, 40) : '重油做法为主') + '为主，建议下次把其中一道换成清炒或蒜蓉类。',
    });
  }
  if (best && best.date !== worst.date) {
    mealComments.push({
      date: best.date, meal: '全天',
      comment: '这天搭配最均衡：脂肪 ' + best.fat + 'g、纤维 ' + best.fiber + 'g，素菜比例更合理，可以照这个吃法继续。',
    });
  }

  const advice = [];
  if (stats.problems.some((p) => p.key === 'fat' || p.key === 'fried')) {
    advice.push('每天至少一餐把红烧/干锅类换成清炒、蒜蓉或蒸菜（如蒜蓉西兰花、炝炒小白菜）');
  }
  if (stats.problems.some((p) => p.key === 'fiber')) {
    advice.push('每餐加一份绿叶菜或一份汤，目标是每天纤维 25g');
  }
  if (stats.problems.some((p) => p.key === 'protein')) {
    advice.push('早餐固定加一个营养蛋或一杯豆浆，蛋白缺口最容易在这里补上');
  }
  if (stats.problems.some((p) => p.key === 'calLow')) {
    advice.push('主食别省，午餐主食保持一份，再加一道豆制品提高饱腹感和蛋白');
  }
  if (stats.problems.some((p) => p.key === 'cal')) {
    advice.push('把一份荤菜换成素菜，主食减到八分满，热量就能回到目标区间');
  }
  advice.push('继续保持每天记录，一周后再看趋势变化');

  return {
    summary,
    highlights,
    problems,
    meal_comments: mealComments,
    advice: advice.slice(0, 5),
  };
}

function suggestFor(key, vegTop) {
  const veg = vegTop && vegTop.length ? vegTop[0] : '蒜蓉西兰花';
  const map = {
    fat: '把红烧、干锅类减少到每周 2 次以内，优先选清蒸、白灼、蒜蓉做法；' + veg + '这类菜可以多安排。',
    fiber: '每餐固定加一份绿叶菜或菌菇，日均纤维目标 25g；燕麦饭、红豆饭换成精白米饭效果更好。',
    protein: '早餐加一个营养蛋或一杯牛奶，午晚餐各保留一份高蛋白荤菜（如卤鸡腿、豆花龙利鱼）。',
    cal: '主食减到八分满，加一份素菜替换掉一份荤菜，热量能降 200 kcal 左右。',
    calLow: '主食不要省，午餐加一份主食或豆制品，必要时加餐一份水果或牛奶。',
    fried: '把干锅、油炸、粉蒸类每周控制在 3 次以内，多用清炒、白灼、炖煮替代。',
  };
  return map[key] || '按食堂现有菜品，替换其中一道为清炒或炖煮类即可。';
}

// ─── 字段校验：模型输出必须齐全，否则降级 ───────
function validateAnalysis(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.summary !== 'string' || obj.summary.length < 20) return false;
  const arr = ['highlights', 'problems', 'meal_comments', 'advice'];
  for (const k of arr) {
    if (!Array.isArray(obj[k]) || !obj[k].length) return false;
  }
  return true;
}

// ─── 主入口 ────────────────────────────────────
/**
 * 生成某学生的本周饮食健康分析
 * @param {number} studentId
 * @param {{refresh?:boolean}} [opts]
 */
async function analyze(studentId, opts) {
  const id = parseInt(studentId, 10);
  const stats = weekMeals.computeWeekStats(id);
  const digest = weekMeals.buildMealDigest(id);
  const profile = studentProfiles[id] || {};
  // 缓存键带上「当天日期」：跨天后自动重新生成，避免文案里还说着昨天
  const cacheKey = id + ':' + cal.toDateStr(new Date()) + ':' + stats.dateRange;

  if (!opts || !opts.refresh) {
    const hit = CACHE.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return { ...hit.data, cached: true };
    }
  }

  let analysis = null;
  let source = 'fallback';
  let aiError = null;
  let usage = null;

  if (isConfigured()) {
    const res = await chatWithRetry({
      model: config.models.flash,
      tag: 'week-health',
      json: true,
      thinking: false,
      temperature: 0.7,
      maxTokens: 2200,
      messages: [
        { role: 'system', content: WEEK_HEALTH_SYSTEM },
        { role: 'user', content: buildWeekHealthUser(stats, digest, profile) },
      ],
    });
    if (res.ok) {
      const parsed = parseJson(res.content);
      if (validateAnalysis(parsed)) {
        analysis = parsed;
        source = 'ai';
        usage = res.usage || null;
      } else {
        aiError = 'invalid_json';
      }
    } else {
      aiError = res.error || 'ai_failed';
    }
  } else {
    aiError = 'not_configured';
  }

  if (!analysis) analysis = fallbackAnalysis(stats, digest, profile);

  const data = {
    studentId: id,
    student: { name: profile.name || '', avatar: profile.avatar || '🧑', diet: stats.diet, goalType: stats.goalType },
    week: stats.week,
    weekNo: stats.weekNo,
    dateRange: stats.dateRange,
    startDate: stats.startDate,
    endDate: stats.endDate,
    updatedAt: stats.updatedAt,
    sourceWeek: stats.sourceWeek,
    // 评分与等级永远来自确定性计算，AI 无权修改
    score: stats.score,
    level: stats.level,
    targets: stats.targets,
    avg: stats.avg,
    counts: stats.counts,
    daily: stats.daily,
    problems: stats.problems,
    highlights: stats.highlights,
    analysis: {
      summary: analysis.summary,
      highlights: analysis.highlights || [],
      problems: analysis.problems || [],
      mealComments: analysis.meal_comments || [],
      advice: analysis.advice || [],
    },
    source,
    aiError,
    usage,
    mockMode: !isConfigured(),
    generatedAt: new Date().toISOString(),
    disclaimer: '以上为膳食建议，不作为医学诊断；如有健康问题请咨询校医或专业营养师。',
  };

  CACHE.set(cacheKey, { at: Date.now(), data });
  return { ...data, cached: false };
}

function clearCache(studentId) {
  if (studentId === undefined) { CACHE.clear(); return; }
  const prefix = parseInt(studentId, 10) + ':';
  Array.from(CACHE.keys()).forEach((k) => { if (k.indexOf(prefix) === 0) CACHE.delete(k); });
}

async function status() {
  return {
    configured: isConfigured(),
    cacheEntries: CACHE.size,
    usage: getUsage(),
  };
}

module.exports = { analyze, clearCache, status, fallbackAnalysis, validateAnalysis };
