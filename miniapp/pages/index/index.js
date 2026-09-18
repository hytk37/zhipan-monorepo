// pages/index/index.js
const app = getApp();
const api = require('../../utils/api');

Page({
  data: {
    studentName: '张三',
    todayDate: '',
    // 营养数据
    nutrition: {
      calories: 1680, caloriesTarget: 2200, calPct: 76,
      calBarStyle: 'width:76%;background:#FF9500',
      protein: 68, proteinTarget: 75,
      carbs: 210, carbsTarget: 280,
      fat: 48, fatTarget: 65,
      fiber: 18, fiberTarget: 25,
      score: 82
    },
    // 进度条
    bars: [
      { label: '蛋白质', pct: 90, color: '#FF6B35', val: '68/75g', barStyle: 'width:90%;background:#FF6B35' },
      { label: '碳水', pct: 75, color: '#07C160', val: '210/280g', barStyle: 'width:75%;background:#07C160' },
      { label: '脂肪', pct: 74, color: '#007AFF', val: '48/65g', barStyle: 'width:74%;background:#007AFF' },
      { label: '膳食纤维', pct: 72, color: '#AF52DE', val: '18/25g', barStyle: 'width:72%;background:#AF52DE' }
    ],
    // 本周趋势（barHeight / calText / barStyle 预计算好，WXML 里只做取值）
    weekTrend: [
      { day: '周一', cal: 1950, calText: '1.9k', barHeight: 89, barStyle: 'height:89%', active: false },
      { day: '周二', cal: 1820, calText: '1.8k', barHeight: 83, barStyle: 'height:83%', active: false },
      { day: '周三', cal: 2100, calText: '2.1k', barHeight: 95, barStyle: 'height:95%', active: false },
      { day: '周四', cal: 1680, calText: '1.7k', barHeight: 76, barStyle: 'height:76%', active: true },
      { day: '周五', cal: 0, calText: '', barHeight: 3, barStyle: 'height:3%', active: false },
      { day: '周六', cal: 0, calText: '', barHeight: 3, barStyle: 'height:3%', active: false },
      { day: '周日', cal: 0, calText: '', barHeight: 3, barStyle: 'height:3%', active: false }
    ],
    // 今日推荐菜品（来自第13周真实食谱）
    todayFoods: [
      { id: 1, emoji: '🍖', name: '干锅排骨', desc: '蛋白质 24g · 热量 420kcal', tags: [{ text: '高蛋白', type: 'green' }, { text: '人气王', type: 'green' }, { text: '脂肪较高', type: 'orange' }] },
      { id: 2, emoji: '🥦', name: '蒜蓉西兰花', desc: '膳食纤维 4.5g · 热量 85kcal', tags: [{ text: '高纤维', type: 'green' }, { text: '低卡', type: 'blue' }] },
      { id: 3, emoji: '🍚', name: '玉米饭', desc: '碳水 54g · 热量 260kcal', tags: [{ text: '低GI', type: 'green' }, { text: '粗粮', type: 'blue' }] }
    ],
    // AI 预警
    aiWarning: '检测到您本周蔬菜摄入偏少，建议午餐增加一份绿叶菜 🥬',
    aiWarningType: 'orange',
    checked: false,
    maxCal: 2200
  },

  onLoad() {
    // 同步用户名称（与"我的"页面保持一致）
    const studentInfo = wx.getStorageSync('studentInfo') || {};
    if (studentInfo.name) {
      this.setData({ studentName: studentInfo.name });
    }
    this.setData({ todayDate: this.formatDate(new Date()) });
    this.loadNutritionData();
  },

  onShow() {
    // 每次显示时刷新名称（用户在设置页修改后回到首页）
    const studentInfo = wx.getStorageSync('studentInfo') || {};
    if (studentInfo.name) {
      this.setData({ studentName: studentInfo.name });
    }
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.loadNutritionData();
  },

  onPullDownRefresh() {
    this.loadNutritionData();
    wx.stopPullDownRefresh();
  },

  formatDate(date) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    return m + '月' + d + '日 周' + weekDays[date.getDay()];
  },

  loadNutritionData() {
    // 第1步：从本地缓存加载（即时显示）
    const saved = wx.getStorageSync('todayNutrition');
    if (saved) {
      this._applyNutrition(saved);
    }
    // 第2步：从服务器拉取最新数据（后台刷新）
    const studentId = app.globalData.currentStudentId;
    if (studentId) {
      api.student.getTodayNutrition(studentId).then(function(nData) {
        if (nData) {
          wx.setStorageSync('todayNutrition', nData);
          this._applyNutrition(nData);
        }
      }.bind(this)).catch(function() {
        console.log('服务器未连接，使用本地营养数据');
      });
    }
  },

  _applyNutrition(n) {
    const pct = v => Math.min(Math.round((n[v] / n[v + 'Target']) * 100), 100);
    n.calPct = Math.min(Math.round((n.calories / n.caloriesTarget) * 100), 100);
    // 进度条宽度直接拼成 style 字符串：WXML 里写 "{{pct}}%" 会被样式校验报 semi-colon expected
    const bar = (p, color) => 'width:' + p + '%;background:' + color;
    this.setData({
      nutrition: n,
      checked: n.checked || false,
      'nutrition.calBarStyle': bar(n.calPct, '#FF9500'),
      bars: [
        { label: '蛋白质', pct: pct('protein'), color: '#FF6B35', val: n.protein + '/' + n.proteinTarget + 'g', barStyle: bar(pct('protein'), '#FF6B35') },
        { label: '碳水', pct: pct('carbs'), color: '#07C160', val: n.carbs + '/' + n.carbsTarget + 'g', barStyle: bar(pct('carbs'), '#07C160') },
        { label: '脂肪', pct: pct('fat'), color: '#007AFF', val: n.fat + '/' + n.fatTarget + 'g', barStyle: bar(pct('fat'), '#007AFF') },
        { label: '膳食纤维', pct: pct('fiber'), color: '#AF52DE', val: n.fiber + '/' + n.fiberTarget + 'g', barStyle: bar(pct('fiber'), '#AF52DE') }
      ],
      maxCal: n.caloriesTarget
    });
  },

  // 打卡
  doCheckin() {
    if (this.data.checked) return;
    wx.showModal({
      title: '确认打卡',
      content: '确认今日营养目标已完成？',
      success: (res) => {
        if (res.confirm) {
          const n = this.data.nutrition;
          n.checked = true;
          n.score = Math.min(n.score + 5, 100);
          wx.setStorageSync('todayNutrition', n);
          this.setData({ checked: true, 'nutrition.score': n.score });
          wx.showToast({ title: '打卡成功！+5分', icon: 'success' });
          // 同步到服务器
          const studentId = app.globalData.currentStudentId;
          if (studentId) {
            api.student.checkin(studentId).catch(function() {});
          }
        }
      }
    });
  },

  // 跳转菜品详情
  goFoodDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/food-detail/food-detail?id=' + id });
  },

  // 跳转营养详情
  goNutritionDetail() {
    wx.navigateTo({ url: '/pages/nutrition-detail/nutrition-detail' });
  },

  // 换一批推荐
  refreshFoods() {
    wx.showLoading({ title: '换一批...' });
    setTimeout(() => {
      const allFoods = [
        { id: 17, emoji: '🥩', name: '番茄牛腩', desc: '蛋白质 26g · 热量 340kcal', tags: [{ text: '高蛋白', type: 'green' }, { text: '补铁', type: 'blue' }] },
        { id: 2, emoji: '🥬', name: '蒜蓉西兰花', desc: '膳食纤维 4.5g · 热量 85kcal', tags: [{ text: '低卡', type: 'blue' }, { text: '高纤维', type: 'green' }] },
        { id: 10, emoji: '🍜', name: '素椒杂酱面', desc: '碳水 72g · 热量 520kcal', tags: [{ text: '人气王', type: 'green' }, { text: '主食', type: 'blue' }] },
        { id: 13, emoji: '🍤', name: '虾仁绍子蒸蛋', desc: '蛋白质 15g · 热量 180kcal', tags: [{ text: '易消化', type: 'blue' }, { text: '高蛋白', type: 'green' }] },
        { id: 15, emoji: '🌽', name: '双椒玉米', desc: '碳水 19g · 热量 130kcal', tags: [{ text: '粗粮', type: 'blue' }, { text: '低GI', type: 'green' }] }
      ];
      // 随机选3个
      const shuffled = allFoods.sort(() => 0.5 - Math.random());
      this.setData({ todayFoods: shuffled.slice(0, 3) });
      wx.hideLoading();
    }, 600);
  }
});
