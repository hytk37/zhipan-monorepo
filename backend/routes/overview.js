// ============================================
// HX系统 · 数据概览路由
// ============================================
// 说明：后厨相关接口（KPI / 雷达图 / 热力图 / 预测 / 采购 / 上新）
// 统一由 routes/kitchen.js 提供，同时挂载在 /api 与 /api/kitchen 两个前缀下，
// 此处不再重复定义，避免两份实现数据漂移。
const { Router } = require('express');
const router = Router();
const {
  students, nutritionData, fiberDist, monthlyTrend, systemStatus,
} = require('../models/data');

// 学生列表
router.get('/students', (req, res) => {
  res.json(students.map(({ id, name, gender, age }) => ({ id, name, gender, age })));
});

// 单个学生营养数据
router.get('/student/:id/nutrition', (req, res) => {
  const id = parseInt(req.params.id);
  const data = nutritionData[id];
  if (data) res.json(data);
  else res.status(404).json({ error: 'Student not found' });
});

// 膳食纤维分布
router.get('/overview/fiber-dist', (req, res) => { res.json(fiberDist); });

// 30日趋势
router.get('/overview/monthly-trend', (req, res) => { res.json(monthlyTrend); });

// 系统状态
router.get('/overview/system-status', (req, res) => { res.json(systemStatus); });

module.exports = router;
