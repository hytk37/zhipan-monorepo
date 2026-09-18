// ============================================
// 智慧膳系统 · AI 能力路由
// ============================================
// 挂载于 /api，实际路径示例：
//   GET  /api/ai/status
//   GET  /api/ai/week-meals/:studentId
//   GET  /api/ai/health/week/:studentId
//   POST /api/ai/chat
//   POST /api/ai/recognize-meal
//   POST /api/ai/meal-log
//   GET  /api/ai/candidates/:studentId
// 设计边界：评分与营养数值来自确定性代码；AI 只负责解释与表达

const { Router } = require('express');
const router = Router();

const weekHealth = require('../services/ai/weekHealth');
const coach = require('../services/ai/coach');
const recognize = require('../services/ai/recognize');
const client = require('../services/ai/client');
const weekMeals = require('../services/weekMeals');
const { describe } = require('../config/deepseek');
const { studentProfiles } = require('../models/data');

function studentIdOf(req) {
  return parseInt(req.params.studentId || req.query.studentId || (req.body && req.body.studentId), 10);
}

// ─── 配置与用量状态 ────────────────────────────
router.get('/ai/status', (req, res) => {
  res.json({
    ...describe(),
    cache: { weekHealthEntries: 0 },
    usage: client.getUsage(),
  });
});

router.get('/ai/usage', (req, res) => {
  res.json({ today: client.getUsage(), recent: client.getRecentLog(20) });
});

// ─── 周用餐记录（确定性数据，不调模型）─────────
router.get('/ai/week-meals/:studentId', (req, res) => {
  const id = studentIdOf(req);
  const profile = studentProfiles[id];
  if (!profile) return res.status(404).json({ error: '学生不存在: ' + id });
  res.json({
    week: weekMeals.getWeek(id),
    stats: weekMeals.computeWeekStats(id),
  });
});

// ─── 本周饮食健康分析（AI，含降级）────────────
router.get('/ai/health/week/:studentId', async (req, res) => {
  const id = studentIdOf(req);
  if (!studentProfiles[id]) return res.status(404).json({ error: '学生不存在: ' + id });
  const data = await weekHealth.analyze(id, { refresh: req.query.refresh === '1' });
  res.json(data);
});

// ─── 追问对话 ──────────────────────────────────
router.post('/ai/chat', async (req, res) => {
  const id = studentIdOf(req);
  if (!studentProfiles[id]) return res.status(404).json({ error: '学生不存在: ' + id });
  const body = req.body || {};
  const result = await coach.answer(id, body.question, body.history);
  res.json({ studentId: id, question: body.question || '', ...result });
});

// ─── 拍照识别一餐 ──────────────────────────────
router.post('/ai/recognize-meal', async (req, res) => {
  const id = studentIdOf(req);
  if (!studentProfiles[id]) return res.status(404).json({ error: '学生不存在: ' + id });
  const body = req.body || {};
  const image = body.image || '';
  if (!image) return res.status(400).json({ ok: false, error: '缺少图片数据' });
  if (image.length > 900000) {
    return res.status(413).json({ ok: false, error: '图片过大，请压缩到 512px 以内再上传' });
  }
  const result = await recognize.recognizeMeal(id, image, {
    commit: !!body.commit,
    date: body.date,
    meal: body.meal,
    time: body.time,
  });
  res.status(result.ok ? 200 : 200).json(result);
});

// ─── 手动记一餐（同样过安全过滤）───────────────
router.post('/ai/meal-log', (req, res) => {
  const id = studentIdOf(req);
  if (!studentProfiles[id]) return res.status(404).json({ error: '学生不存在: ' + id });
  const body = req.body || {};
  const result = recognize.logMeal(id, {
    date: body.date,
    meal: body.meal,
    time: body.time,
    dishes: body.dishes || [],
  });
  if (!result.ok) return res.status(400).json(result);
  weekHealth.clearCache(id);   // 记录变化后让分析重新生成
  res.json(result);
});

// ─── 可记餐的菜名候选（已过安全过滤）──────────
router.get('/ai/candidates/:studentId', (req, res) => {
  const id = studentIdOf(req);
  const profile = studentProfiles[id];
  if (!profile) return res.status(404).json({ error: '学生不存在: ' + id });
  const names = recognize.candidateNamesFor(profile);
  res.json({
    studentId: id,
    diet: profile.diet,
    allergyList: profile.allergyList || [],
    total: names.length,
    names,
  });
});

module.exports = router;
