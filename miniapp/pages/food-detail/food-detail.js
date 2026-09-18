// pages/food-detail/food-detail.js
const api = require('../../utils/api');

Page({
  data: {
    food: {},
    nutritionData: [],
    relatedFoods: []
  },

  onLoad(options) {
    const id = options.id || 1;
    this.loadFood(id);
  },

  loadFood(id) {
    // 第1步：先尝试从服务器加载
    api.food.getDetail(id).then(function(food) {
      if (food && food.name !== '未知菜品') {
        this._displayFood(food, id);
      } else {
        this._loadLocalFood(id);
      }
    }.bind(this)).catch(function() {
      this._loadLocalFood(id);
    }.bind(this));
  },

  _displayFood(food, id) {
    this.setData({
      food: food,
      nutritionData: [
        { label: '热量', value: food.cal, unit: 'kcal', color: '#FF9500' },
        { label: '蛋白质', value: food.protein, unit: 'g', color: '#FF6B35' },
        { label: '碳水', value: food.carbs, unit: 'g', color: '#07C160' },
        { label: '脂肪', value: food.fat, unit: 'g', color: '#007AFF' },
        { label: '膳食纤维', value: food.fiber, unit: 'g', color: '#AF52DE' }
      ],
      relatedFoods: []
    });
  },

  _loadLocalFood(id) {
    var foodDB = {
      // 与后端 foodDB（第13周真实食谱）id 1-22 对齐
      1: { emoji: '🍖', name: '干锅排骨', cal: 420, protein: 24, fat: 28, carbs: 18, fiber: 2, tags: ['高蛋白', '人气王'], allergy: [], source: '一食堂 · 套餐窗口', rating: 4.8, eatCount: 1286 },
      2: { emoji: '🥦', name: '蒜蓉西兰花', cal: 85, protein: 4, fat: 4, carbs: 8, fiber: 4.5, tags: ['高纤维', '低卡'], allergy: [], source: '一食堂 · 素菜窗口', rating: 4.2, eatCount: 856 },
      3: { emoji: '🍚', name: '玉米饭', cal: 260, protein: 7, fat: 2, carbs: 54, fiber: 4, tags: ['粗粮', '低GI'], allergy: [], source: '一食堂 · 主食区', rating: 4.0, eatCount: 2100 },
      4: { emoji: '🥘', name: '碎肉豌豆', cal: 260, protein: 14, fat: 12, carbs: 24, fiber: 4, tags: ['高蛋白'], allergy: [], source: '一食堂 · 套餐窗口', rating: 4.3, eatCount: 960 },
      5: { emoji: '🍲', name: '银耳汤', cal: 60, protein: 1, fat: 0.5, carbs: 14, fiber: 2, tags: ['低卡', '滋阴'], allergy: [], source: '一食堂 · 汤区', rating: 4.1, eatCount: 720 },
      6: { emoji: '🦑', name: '豆腐烧三鲜', cal: 280, protein: 16, fat: 16, carbs: 18, fiber: 3, tags: ['高蛋白'], allergy: ['虾蟹'], source: '二食堂 · 特色窗口', rating: 4.5, eatCount: 580 },
      7: { emoji: '🦆', name: '甜皮鸭', cal: 390, protein: 26, fat: 24, carbs: 14, fiber: 1, tags: ['人气王'], allergy: [], source: '二食堂 · 特色窗口', rating: 4.8, eatCount: 1600 },
      8: { emoji: '🍗', name: '脆皮鸡腿', cal: 360, protein: 28, fat: 20, carbs: 12, fiber: 1, tags: ['高蛋白'], allergy: [], source: '二食堂 · 特色窗口', rating: 4.6, eatCount: 2150 },
      9: { emoji: '🍗', name: '卤鸡腿', cal: 310, protein: 26, fat: 18, carbs: 6, fiber: 0, tags: ['高蛋白', '低卡'], allergy: [], source: '一食堂 · 特色窗口', rating: 4.6, eatCount: 1800 },
      10: { emoji: '🍜', name: '素椒杂酱面', cal: 520, protein: 18, fat: 16, carbs: 72, fiber: 3, tags: ['人气王'], allergy: ['麸质'], source: '一食堂 · 面食窗口', rating: 4.8, eatCount: 3200 },
      11: { emoji: '🍖', name: '胡萝卜烧肘子', cal: 460, protein: 28, fat: 32, carbs: 16, fiber: 1, tags: ['高蛋白'], allergy: [], source: '一食堂 · 套餐窗口', rating: 4.5, eatCount: 980 },
      12: { emoji: '🥬', name: '莲白肉片', cal: 220, protein: 14, fat: 14, carbs: 8, fiber: 2, tags: ['高蛋白'], allergy: [], source: '一食堂 · 套餐窗口', rating: 4.2, eatCount: 640 },
      13: { emoji: '🍤', name: '虾仁绍子蒸蛋', cal: 180, protein: 15, fat: 11, carbs: 5, fiber: 0, tags: ['高蛋白', '易消化'], allergy: ['蛋', '虾蟹'], source: '一食堂 · 套餐窗口', rating: 4.4, eatCount: 920 },
      14: { emoji: '🍛', name: '台式卤肉盖浇饭', cal: 680, protein: 22, fat: 26, carbs: 88, fiber: 3, tags: ['人气王'], allergy: [], source: '一食堂 · 盖浇饭窗口', rating: 4.7, eatCount: 1560 },
      15: { emoji: '🌽', name: '双椒玉米', cal: 130, protein: 4, fat: 5, carbs: 19, fiber: 3, tags: ['粗粮', '低GI'], allergy: [], source: '一食堂 · 素菜窗口', rating: 4.0, eatCount: 480 },
      16: { emoji: '🌶️', name: '水煮肉片', cal: 380, protein: 26, fat: 26, carbs: 10, fiber: 1, tags: ['高蛋白'], allergy: [], source: '二食堂 · 特色窗口', rating: 4.6, eatCount: 1360 },
      17: { emoji: '🥩', name: '番茄牛腩', cal: 340, protein: 26, fat: 18, carbs: 14, fiber: 2, tags: ['高蛋白', '补铁'], allergy: [], source: '一食堂 · 特色窗口', rating: 4.7, eatCount: 1180 },
      18: { emoji: '🍅', name: '番茄炒蛋', cal: 190, protein: 9, fat: 13, carbs: 9, fiber: 1, tags: ['营养均衡', '家常'], allergy: ['蛋'], source: '一食堂 · 套餐窗口', rating: 4.5, eatCount: 2400 },
      19: { emoji: '🐟', name: '豆花龙利鱼', cal: 240, protein: 24, fat: 12, carbs: 10, fiber: 0, tags: ['高蛋白', '低脂'], allergy: [], source: '二食堂 · 特色窗口', rating: 4.6, eatCount: 760 },
      20: { emoji: '🐰', name: '山椒兔', cal: 260, protein: 26, fat: 13, carbs: 6, fiber: 0, tags: ['高蛋白', '低脂'], allergy: [], source: '二食堂 · 特色窗口', rating: 4.4, eatCount: 520 },
      21: { emoji: '🥩', name: '萝卜烧牛腩', cal: 350, protein: 24, fat: 20, carbs: 16, fiber: 2, tags: ['高蛋白', '补铁'], allergy: [], source: '一食堂 · 特色窗口', rating: 4.6, eatCount: 880 },
      22: { emoji: '🍲', name: '冬瓜肉片汤', cal: 95, protein: 8, fat: 5, carbs: 4, fiber: 1, tags: ['低卡'], allergy: [], source: '一食堂 · 汤区', rating: 4.2, eatCount: 1100 },
      // 推荐页 AI 方案菜品 (id 101-104，与 recommend.js aiPlan.foods 对应)
      101: { emoji: '🍗', name: '粉蒸鸡腿', cal: 420, protein: 27, fat: 22, carbs: 24, fiber: 1, tags: ['高蛋白'], allergy: [], source: '二食堂 · 特色窗口', rating: 4.5, eatCount: 1086 },
      102: { emoji: '🥚', name: '营养蛋×2', cal: 150, protein: 14, fat: 10, carbs: 2, fiber: 0, tags: ['优质蛋白', '便捷'], allergy: ['蛋'], source: '一食堂 · 早餐区', rating: 4.6, eatCount: 2150 },
      103: { emoji: '🍚', name: '红薯饭', cal: 250, protein: 5, fat: 1, carbs: 55, fiber: 3, tags: ['粗粮', '低GI'], allergy: [], source: '一食堂 · 主食区', rating: 4.0, eatCount: 1980 },
      104: { emoji: '🥦', name: '蒜蓉西兰花', cal: 85, protein: 4, fat: 4, carbs: 8, fiber: 4.5, tags: ['高纤维', '低卡'], allergy: [], source: '一食堂 · 素菜窗口', rating: 4.2, eatCount: 856 }
    };
    var food = foodDB[id] || foodDB[1];
    this._displayFood(food, id);
  },

  addToMeal() {
    wx.showModal({
      title: '加入今日餐单',
      content: '将「' + this.data.food.name + '」添加到哪一餐？',
      confirmText: '午餐',
      cancelText: '晚餐',
      success: (res) => {
        const mealType = res.confirm ? '午餐' : '晚餐';
        const n = wx.getStorageSync('todayNutrition') || {};
        n.calories = (n.calories || 0) + this.data.food.cal;
        n.protein = (n.protein || 0) + this.data.food.protein;
        wx.setStorageSync('todayNutrition', n);
        wx.showToast({ title: '已加入' + mealType, icon: 'success' });
      }
    });
  },

  goFoodDetail(e) {
    const id = e.currentTarget.dataset.id;
    this.loadFood(id);
  }
});
