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
      // 首页今日推荐菜品 (id 1-3)
      1: { emoji: '🍗', name: '红烧鸡腿', cal: 320, protein: 28, fat: 12, carbs: 8, fiber: 0.5, tags: ['高蛋白','低脂'], allergy: [], source: '一食堂 · 窗口3', rating: 4.5, eatCount: 1286 },
      2: { emoji: '🥦', name: '蒜蓉西兰花', cal: 80, protein: 4, fat: 3, carbs: 8, fiber: 5, tags: ['高纤维','低卡'], allergy: [], source: '一食堂 · 窗口5', rating: 4.2, eatCount: 856 },
      3: { emoji: '🍚', name: '杂粮米饭', cal: 210, protein: 5, fat: 1, carbs: 45, fiber: 3, tags: ['低GI','粗粮'], allergy: [], source: '一食堂 · 主食区', rating: 4.0, eatCount: 2100 },
      // 首页通用菜品 (id 4-9)
      4: { emoji: '🥩', name: '酱牛肉', cal: 380, protein: 35, fat: 18, carbs: 5, fiber: 0, tags: ['高蛋白','补铁'], allergy: [], source: '二食堂 · 窗口2', rating: 4.7, eatCount: 960 },
      5: { emoji: '🥬', name: '清炒菠菜', cal: 60, protein: 3, fat: 2, carbs: 6, fiber: 4, tags: ['低卡','补铁'], allergy: [], source: '一食堂 · 窗口5', rating: 4.1, eatCount: 720 },
      6: { emoji: '🐟', name: '清蒸鲈鱼', cal: 200, protein: 30, fat: 6, carbs: 2, fiber: 0, tags: ['高蛋白','低脂'], allergy: [], source: '二食堂 · 窗口6', rating: 4.8, eatCount: 580 },
      7: { emoji: '🥣', name: '紫菜蛋花汤', cal: 45, protein: 4, fat: 2, carbs: 3, fiber: 0.5, tags: ['低卡','暖胃'], allergy: ['蛋'], source: '一食堂 · 汤区', rating: 4.0, eatCount: 1600 },
      8: { emoji: '🥚', name: '水煮蛋×2', cal: 150, protein: 12, fat: 10, carbs: 2, fiber: 0, tags: ['优质蛋白','便捷'], allergy: ['蛋'], source: '一食堂 · 早餐区', rating: 4.6, eatCount: 2150 },
      9: { emoji: '🥛', name: '纯牛奶250ml', cal: 160, protein: 8, fat: 8, carbs: 12, fiber: 0, tags: ['补钙','优质蛋白'], allergy: ['乳制品'], source: '一食堂 · 饮品区', rating: 4.3, eatCount: 1800 },
      // 推荐页食堂精选菜品 (id 10-22，与 recommend.js chefPicks 完全对应)
      10: { emoji: '🍜', name: '牛肉拉面', cal: 580, protein: 35, fat: 15, carbs: 68, fiber: 2, tags: ['人气王','高蛋白'], allergy: [], source: '二食堂 · 窗口1', rating: 4.8, eatCount: 3200 },
      11: { emoji: '🥗', name: '轻食沙拉套餐', cal: 320, protein: 18, fat: 10, carbs: 35, fiber: 6, tags: ['低卡','轻食'], allergy: ['花生'], source: '三食堂 · 轻食区', rating: 4.3, eatCount: 1560 },
      12: { emoji: '🍲', name: '番茄炖牛腩', cal: 420, protein: 42, fat: 20, carbs: 12, fiber: 2, tags: ['补铁','高蛋白'], allergy: [], source: '一食堂 · 窗口2', rating: 4.6, eatCount: 1180 },
      13: { emoji: '🥬', name: '素炒时蔬拼盘', cal: 120, protein: 5, fat: 4, carbs: 12, fiber: 8, tags: ['素食','低卡'], allergy: [], source: '一食堂 · 窗口5', rating: 4.0, eatCount: 640 },
      14: { emoji: '🥩', name: '黑椒牛排', cal: 420, protein: 48, fat: 22, carbs: 3, fiber: 0, tags: ['增肌','高蛋白'], allergy: [], source: '二食堂 · 窗口4', rating: 4.5, eatCount: 480 },
      15: { emoji: '🌽', name: '玉米山药粥', cal: 260, protein: 6, fat: 2, carbs: 52, fiber: 4, tags: ['素食','养胃'], allergy: [], source: '一食堂 · 早餐区', rating: 4.2, eatCount: 920 },
      16: { emoji: '🍛', name: '咖喱蔬菜配鹰嘴豆', cal: 320, protein: 18, fat: 10, carbs: 42, fiber: 8, tags: ['素食','高纤维','南亚风味'], allergy: [], source: '三食堂 · 异域窗口', rating: 4.1, eatCount: 360 },
      17: { emoji: '🐟', name: '清蒸鲈鱼', cal: 280, protein: 45, fat: 8, carbs: 4, fiber: 0, tags: ['高蛋白','低脂'], allergy: [], source: '二食堂 · 窗口6', rating: 4.8, eatCount: 980 },
      18: { emoji: '🥟', name: '清真牛肉蒸饺', cal: 350, protein: 20, fat: 12, carbs: 38, fiber: 1, tags: ['清真','人气王'], allergy: [], source: '二食堂 · 清真窗口', rating: 4.4, eatCount: 760 },
      19: { emoji: '🥘', name: '咖喱鸡肉（清真）', cal: 420, protein: 42, fat: 16, carbs: 28, fiber: 2, tags: ['清真','高蛋白','异域风味'], allergy: [], source: '二食堂 · 清真窗口', rating: 4.3, eatCount: 520 },
      20: { emoji: '🥣', name: '藜麦蔬菜碗', cal: 280, protein: 12, fat: 8, carbs: 38, fiber: 10, tags: ['素食','无麸质'], allergy: [], source: '三食堂 · 轻食区', rating: 4.2, eatCount: 420 },
      21: { emoji: '🥜', name: '凉拌木耳菠菜', cal: 150, protein: 6, fat: 6, carbs: 14, fiber: 6, tags: ['素食','低卡'], allergy: [], source: '一食堂 · 窗口5', rating: 4.0, eatCount: 580 },
      22: { emoji: '🍝', name: '番茄鸡蛋炒意面', cal: 390, protein: 15, fat: 12, carbs: 55, fiber: 3, tags: ['蛋奶素','均衡'], allergy: ['蛋','麸质'], source: '三食堂 · 西式窗口', rating: 4.3, eatCount: 680 },
      // 推荐页 AI 方案菜品 (id 101-104，与 recommend.js aiPlan.foods 对应)
      101: { emoji: '🍗', name: '红烧鸡胸肉', cal: 320, protein: 35, fat: 8, carbs: 6, fiber: 0.5, tags: ['高蛋白','低脂'], allergy: [], source: '一食堂 · 窗口3', rating: 4.5, eatCount: 1286 },
      102: { emoji: '🥚', name: '水煮蛋×2', cal: 150, protein: 12, fat: 10, carbs: 2, fiber: 0, tags: ['优质蛋白','便捷'], allergy: ['蛋'], source: '一食堂 · 早餐区', rating: 4.6, eatCount: 2150 },
      103: { emoji: '🍚', name: '糙米饭', cal: 210, protein: 5, fat: 1, carbs: 45, fiber: 3, tags: ['低GI','粗粮'], allergy: [], source: '一食堂 · 主食区', rating: 4.0, eatCount: 2100 },
      104: { emoji: '🥦', name: '清炒西兰花', cal: 80, protein: 4, fat: 3, carbs: 8, fiber: 5, tags: ['高纤维','低卡'], allergy: [], source: '一食堂 · 窗口5', rating: 4.2, eatCount: 856 }
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
