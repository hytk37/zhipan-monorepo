// ============================================
// 智慧膳系统 · 学生业务路由
// ============================================
const { Router } = require('express');
const router = Router();
const {
  studentProfiles, todayNutritionStore, foodDB,
  nutritionData, remindSettingsStore,
} = require('../models/data');

// 获取学生详细档案
router.get('/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const profile = studentProfiles[id];
  if (profile) res.json(profile);
  else res.status(404).json({ error: 'Student not found' });
});

// 更新学生信息
router.put('/students/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const body = req.body;
  if (studentProfiles[id]) {
    Object.assign(studentProfiles[id], body);
    if (body.height && body.weight) {
      const h = body.height / 100;
      studentProfiles[id].bmi = parseFloat((body.weight / (h * h)).toFixed(1));
    }
    res.json({ success: true, data: studentProfiles[id] });
  } else {
    res.status(404).json({ error: 'Student not found' });
  }
});

// 获取今日营养数据
router.get('/students/:id/nutrition/today', (req, res) => {
  const id = parseInt(req.params.id);
  const n = todayNutritionStore[id];
  if (n) res.json(n);
  else res.status(404).json({ error: 'Nutrition data not found' });
});

// 获取营养历史
router.get('/students/:id/nutrition/history', (req, res) => {
  const id = parseInt(req.params.id);
  const days = parseInt(req.query.days) || 7;
  const history = [];
  const base = todayNutritionStore[id] || todayNutritionStore[0];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = (date.getMonth() + 1) + '/' + date.getDate();
    history.push({
      date: dateStr,
      calories: Math.round((base.calories || 1800) * (0.9 + Math.random() * 0.2)),
      protein: Math.round((base.protein || 60) * (0.85 + Math.random() * 0.3)),
      carbs: Math.round((base.carbs || 220) * (0.85 + Math.random() * 0.3)),
      fat: Math.round((base.fat || 50) * (0.85 + Math.random() * 0.3)),
      fiber: Math.round((base.fiber || 18) * (0.8 + Math.random() * 0.4)),
      score: Math.min(100, Math.round(75 + Math.random() * 25))
    });
  }
  res.json(history);
});

// 打卡
router.post('/students/:id/checkin', (req, res) => {
  const id = parseInt(req.params.id);
  if (todayNutritionStore[id]) {
    todayNutritionStore[id].checked = true;
    todayNutritionStore[id].score = Math.min(100, (todayNutritionStore[id].score || 80) + 5);
    res.json({ success: true, score: todayNutritionStore[id].score });
  } else {
    res.status(404).json({ error: 'Student not found' });
  }
});

// 获取推荐菜品
router.get('/recommendations/:studentId', (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const n = nutritionData[studentId];
  if (n && n.recommendations) {
    res.json(n.recommendations);
  } else {
    const allFoods = Object.values(foodDB);
    const shuffled = allFoods.sort(() => 0.5 - Math.random());
    res.json(shuffled.slice(0, 3).map((f, i) => ({
      rank: i + 1, name: f.name, score: Math.round(70 + Math.random() * 30),
      tags: f.tags, desc: f.desc
    })));
  }
});

// 搜索菜品
router.get('/foods/search', (req, res) => {
  const keyword = (req.query.keyword || '').toLowerCase();
  const allFoods = Object.values(foodDB);
  if (!keyword) return res.json(allFoods);
  const result = allFoods.filter(f =>
    f.name.indexOf(keyword) >= 0 ||
    f.tags.some(t => t.indexOf(keyword) >= 0) ||
    f.desc.indexOf(keyword) >= 0
  );
  res.json(result);
});

// 菜品详情
router.get('/foods/:foodId', (req, res) => {
  const foodId = parseInt(req.params.foodId);
  const food = foodDB[foodId];
  if (food) res.json(food);
  else   res.json({ id: foodId, emoji: '🍽️', name: '未知菜品', cal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, tags: [], desc: '暂无信息' });
});

// 食堂菜品列表
router.get('/canteens/:canteenId/foods', (req, res) => {
  res.json(Object.values(foodDB));
});

// 获取提醒设置
router.get('/students/:id/remind', (req, res) => {
  const id = parseInt(req.params.id);
  res.json(remindSettingsStore[id] || {
    breakfast: true, breakfastTime: '07:30',
    lunch: true, lunchTime: '11:30',
    dinner: true, dinnerTime: '17:30'
  });
});

// 保存提醒设置
router.put('/students/:id/remind', (req, res) => {
  const id = parseInt(req.params.id);
  remindSettingsStore[id] = req.body;
  res.json({ success: true });
});

module.exports = router;
