// ============================================
// 智慧膳系统 · 后厨管理路由
// ============================================
const { Router } = require('express');
const router = Router();
const {
  kitchenKPI, groupRadar, heatmapData,
  forecastData, purchaseData, newDishData, systemStatus, weeklyMenu,
} = require('../models/data');

// 一周菜单（学生食谱第13周，真实食谱）
router.get('/menu/week', (req, res) => { res.json(weeklyMenu); });

// 后厨KPI
router.get('/kpi', (req, res) => { res.json(kitchenKPI); });

// 群体营养雷达图
router.get('/group-radar', (req, res) => { res.json(groupRadar); });

// 销量热力图
router.get('/heatmap', (req, res) => { res.json(heatmapData); });

// LSTM销量预测
router.get('/forecast', (req, res) => { res.json(forecastData); });

// 采购建议
router.get('/purchase', (req, res) => { res.json(purchaseData); });

// 菜品上新建议
router.get('/new-dishes', (req, res) => { res.json(newDishData); });

// 后厨概览（简化版）
router.get('/overview', (req, res) => {
  res.json({ mealCount: 4278, avgCal: 2340, avgScore: 82, dishCount: systemStatus.dishCount, studentCount: 4000 });
});

// 销量预测（简化版）
router.get('/sales-forecast', (req, res) => {
  res.json([
    { dish: '玉米饭', qty: 1242, trend: 'up' },
    { dish: '土豆排骨', qty: 870, trend: 'up' },
    { dish: '豆花龙利鱼', qty: 420, trend: 'down' },
    { dish: '番茄炒蛋', qty: 940, trend: 'up' },
  ]);
});

// 预警信息
router.get('/alerts', (req, res) => {
  res.json([
    { level: 'high', title: '脂肪摄入超标', desc: '全校平均脂肪摄入超标50%', count: 2240 },
    { level: 'medium', title: '膳食纤维不足', desc: '整体纤维摄入仅达标56%', count: 1760 },
    { level: 'low', title: '蛋白质缺口', desc: '女生群体蛋白质缺口明显', count: 1120 },
  ]);
});

// 菜单优化建议
router.get('/menu-optimize', (req, res) => {
  res.json([
    { day: '周一', meal: '午餐', from: '红烧狮子头', to: '豆花龙利鱼', fatReduce: 8, proteinIncrease: 12, 受益人数: 320 },
    { day: '周三', meal: '晚餐', action: '增加蒜蓉西兰花作为固定配菜', fiberIncrease: 15, 受益人数: 600 },
    { day: '周五', meal: '午餐', action: '搭配西红柿蛋花汤', balance: '提升', forecastSales: 940 },
  ]);
});

module.exports = router;
