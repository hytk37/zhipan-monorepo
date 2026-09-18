// pages/meals/meals.js
const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    searchKey: '',
    currentMonth: '',
    records: [],
    monthStats: {
      checkDays: 23,
      avgCal: 1860,
      avgScore: 78
    },
    // 日期选择器
    showDatePicker: false,
    selectedDate: ''
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentMonth: (now.getMonth() + 1) + '月',
      selectedDate: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
    });
    this.loadRecords();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  loadRecords() {
    // 第1步：从本地缓存加载即时显示
    this._loadFromLocal();

    // 第2步：后台从服务器拉取最新数据
    const studentId = app.globalData.currentStudentId;
    if (studentId) {
      api.student.getNutritionHistory(studentId, 5).then(function(history) {
        if (history && history.length > 0) {
          wx.setStorageSync('mealHistory', history);
          this._renderHistory(history);
        }
      }.bind(this)).catch(function() {
        console.log('服务器未连接，使用本地用餐数据');
      });
    }
  },

  _loadFromLocal() {
    const cached = wx.getStorageSync('mealHistory');
    if (cached && cached.length > 0) {
      this._renderHistory(cached);
    } else {
      this._loadMockRecords();
    }
  },

  _renderHistory(history) {
    if (!history || !history.length) return;
    const records = history.map(function(h, idx) {
      const d = new Date();
      d.setDate(d.getDate() - (history.length - 1 - idx));
      const dateStr = (d.getMonth() + 1) + '月' + d.getDate() + '日';
      const weekday = idx === history.length - 1 ? '今天' : (idx === history.length - 2 ? '昨天' : ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]);
      // 从服务端数据构造显示格式
      return {
        date: dateStr, weekday: weekday,
        meals: [
          { type: '早餐', time: '08:00', items: '面包+牛奶+鸡蛋', cal: Math.round(h.calories * 0.25), protein: Math.round(h.protein * 0.25), emoji: '🥪' },
          { type: '午餐', time: '12:00', items: '营养午餐', cal: Math.round(h.calories * 0.4), protein: Math.round(h.protein * 0.4), emoji: '🍗' },
          { type: '晚餐', time: '18:00', items: '均衡晚餐', cal: Math.round(h.calories * 0.35), protein: Math.round(h.protein * 0.35), emoji: '🍜' }
        ],
        totalCal: h.calories,
        score: h.score || 80
      };
    });
    this.setData({ records: records, 'monthStats.avgScore': Math.round(records.reduce(function(s, r) { return s + r.score; }, 0) / records.length) });
  },

  _loadMockRecords() {
    // 后备：服务器不可用时的本地 mock 数据
    const records = [
      {
        date: '6月4日', weekday: '今天',
        meals: [
          { type: '早餐', time: '07:30', items: '蔬菜瘦肉粥+营养蛋+学生纯牛奶', cal: 480, protein: 22, emoji: '🥣' },
          { type: '午餐', time: '12:00', items: '土豆排骨+鱼香肉丝+南瓜饭', cal: 720, protein: 38, emoji: '🍖' },
          { type: '晚餐', time: '18:15', items: '魔芋烧鱼+蒜蓉西兰花+胡萝卜饭', cal: 660, protein: 32, emoji: '🐟' }
        ],
        totalCal: 1860,
        score: 85
      },
      {
        date: '6月3日', weekday: '昨天',
        meals: [
          { type: '早餐', time: '08:00', items: '粥+肉包子+豆浆', cal: 420, protein: 15, emoji: '🥟' },
          { type: '午餐', time: '12:10', items: '鱼香肉丝+米饭+紫菜蛋花汤', cal: 780, protein: 28, emoji: '🍛' },
          { type: '晚餐', time: '18:30', items: '酸辣粉+煎蛋', cal: 560, protein: 18, emoji: '🍜' }
        ],
        totalCal: 1760,
        score: 78
      },
      {
        date: '6月2日', weekday: '周一',
        meals: [
          { type: '早餐', time: '07:45', items: '玉米粥+莲白肉包+煎荷包蛋', cal: 380, protein: 12, emoji: '🥣' },
          { type: '午餐', time: '12:05', items: '干锅排骨+碎肉豌豆+玉米饭', cal: 700, protein: 35, emoji: '🍖' },
          { type: '晚餐', time: '18:00', items: '西红柿鸡蛋面+拌卤素什锦', cal: 520, protein: 16, emoji: '🍝' }
        ],
        totalCal: 1600,
        score: 90
      },
      {
        date: '6月1日', weekday: '周日',
        meals: [
          { type: '午餐', time: '12:30', items: '土豆排骨盖浇饭+红油水饺', cal: 850, protein: 40, emoji: '🍲' },
          { type: '晚餐', time: '19:00', items: '酸汤肉丝河粉+香辣翅根', cal: 710, protein: 22, emoji: '🍜' }
        ],
        totalCal: 1560,
        score: 65
      },
      {
        date: '5月31日', weekday: '周六',
        meals: [
          { type: '早餐', time: '09:00', items: '红薯粥+营养蛋+蒸红薯', cal: 520, protein: 14, emoji: '🫓' },
          { type: '午餐', time: '12:00', items: '番茄牛腩+蒜蓉菠菜+燕麦饭', cal: 780, protein: 42, emoji: '🥩' },
          { type: '晚餐', time: '18:30', items: '台式卤肉盖浇饭', cal: 680, protein: 24, emoji: '🍚' }
        ],
        totalCal: 1980,
        score: 82
      }
    ];
    this.setData({ records });
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value });
  },

  // 跳转 AI 本周饮食健康分析
  goWeekHealth() {
    wx.navigateTo({ url: '/pages/week-health/week-health' });
  },

  onSearch() {
    const key = this.data.searchKey.trim();
    if (!key) return;
    wx.showLoading({ title: '搜索中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '搜索完成', icon: 'success' });
    }, 500);
  },

  // 查看某日详情
  goDayDetail(e) {
    const idx = e.currentTarget.dataset.index;
    const record = this.data.records[idx];
    wx.navigateTo({
      url: '/pages/nutrition-detail/nutrition-detail?date=' + record.date
    });
  },

  // 查看某餐详情
  goMealDetail(e) {
    const { dayidx, mealidx } = e.currentTarget.dataset;
    const record = this.data.records[dayidx];
    const meal = record.meals[mealidx];
    wx.showModal({
      title: meal.type + ' · ' + meal.time,
      content: meal.items + '\n热量: ' + meal.cal + 'kcal\n蛋白质: ' + meal.protein + 'g\n营养评分: ' + record.score + '分',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
