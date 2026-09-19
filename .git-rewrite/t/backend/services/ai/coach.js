// ============================================
// 智慧膳系统 · AI 追问对话（营养教练）
// ============================================
// 固定前缀（系统提示 + 该生本周数据）顺序不变，以命中 DeepSeek 上下文缓存
// （命中价约为未命中的 1/5）；未配置 Key 时用规则应答兜底

const { chatWithRetry, getUsage } = require('./client');
const { COACH_SYSTEM, buildCoachContext } = require('./prompts');
const weekMeals = require('../weekMeals');
const { studentProfiles } = require('../../models/data');
const { isConfigured, config } = require('../../config/deepseek');

const MAX_HISTORY = 6;   // 只带最近 6 条，控制 token

// ─── 规则兜底：按问题关键词命中本周真实数据 ─────
function fallbackAnswer(stats, question) {
  const q = String(question || '');
  const a = stats.avg;
  const t = stats.targets;

  if (/脂肪|油腻|油|长胖|胖/.test(q)) {
    return '你本周日均脂肪 ' + a.fat + 'g，目标是 ' + t.fat + 'g'
      + (a.fat > t.fat ? '，确实偏高。主要来自红烧、干锅、粉蒸这类做法。建议每天至少一餐把其中一道荤菜换成清炒或蒸菜（比如蒜蓉西兰花、炝炒小白菜），一周就能把脂肪拉回目标附近。' : '，在目标范围内，保持现在的选菜习惯就好。');
  }
  if (/纤维|蔬菜|便秘|菜/.test(q)) {
    return '本周日均膳食纤维 ' + a.fiber + 'g，目标 ' + t.fiber + 'g，全周有 '
      + stats.counts.fiberMetDays + ' 天达标。纤维主要靠绿叶菜、菌菇和粗粮（燕麦饭、红豆饭）补，建议每餐固定加一份蒜蓉类素菜或一份汤。';
  }
  if (/蛋白|肌肉|增肌|长肉/.test(q)) {
    return '本周日均蛋白质 ' + a.protein + 'g，目标 ' + t.protein + 'g'
      + (a.protein < t.protein ? '，还有点缺口。最容易补的是早餐加一个营养蛋或一杯豆浆，午晚餐各留一份高蛋白菜（卤鸡腿、豆花龙利鱼、番茄牛腩）。' : '，已经达标，继续维持就行。');
  }
  if (/热量|卡路里|kcal|吃多|吃少/.test(q)) {
    return '本周日均热量 ' + a.cal + ' kcal，目标 ' + t.cal + ' kcal。'
      + (a.cal > t.cal * 1.1 ? '偏高一些，把主食减到八分满、替换一份荤菜为素菜，一天能降 200 kcal 左右。'
        : a.cal < t.cal * 0.85 ? '偏低，主食不要省，必要时下午加一份水果或牛奶。' : '在合理范围内。');
  }
  if (/吃什么|推荐|建议|怎么吃|搭配/.test(q)) {
    const advice = stats.problems.length
      ? stats.problems.map((p) => p.title).join('、')
      : '整体均衡';
    return '结合本周数据（' + advice + '），建议：午餐主食 + 一份荤菜 + 一份素菜 + 一份汤；晚餐把荤菜换成鱼或豆制品。优先选蒜蓉/清炒/白灼做法的菜。';
  }
  return '我目前只能回答和你本周饮食数据相关的问题。你本周评分 ' + stats.score + ' 分（' + stats.level
    + '），可以问我脂肪、纤维、蛋白质、热量或「该吃什么」。';
}

/**
 * 学生追问
 * @param {number} studentId
 * @param {string} question
 * @param {Array<{role:string,content:string}>} [history]
 */
async function answer(studentId, question, history) {
  const id = parseInt(studentId, 10);
  const stats = weekMeals.computeWeekStats(id);
  const digest = weekMeals.buildMealDigest(id);
  const profile = studentProfiles[id] || {};

  if (!question || !String(question).trim()) {
    return { answer: '想问点什么呢？比如「我这周脂肪为什么偏高」。', source: 'fallback', usage: null };
  }

  if (!isConfigured()) {
    return { answer: fallbackAnswer(stats, question), source: 'fallback', usage: null, mockMode: true };
  }

  const messages = [
    { role: 'system', content: COACH_SYSTEM },
    // 这一条在本周内完全固定 → 命中上下文缓存
    { role: 'user', content: buildCoachContext(stats, digest) },
  ];
  (history || []).slice(-MAX_HISTORY).forEach((h) => {
    if (!h || !h.content) return;
    messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: String(h.content).slice(0, 500) });
  });
  messages.push({ role: 'user', content: String(question).slice(0, 500) });

  const res = await chatWithRetry({
    model: config.models.flash,
    tag: 'coach',
    thinking: false,
    temperature: 0.7,
    maxTokens: 600,
    messages,
  });

  if (res.ok && res.content) {
    return { answer: res.content.trim(), source: 'ai', usage: res.usage || null, mockMode: false };
  }
  return {
    answer: fallbackAnswer(stats, question),
    source: 'fallback',
    aiError: res.error || 'ai_failed',
    usage: null,
    mockMode: false,
  };
}

function usage() { return getUsage(); }

module.exports = { answer, usage, fallbackAnswer };
