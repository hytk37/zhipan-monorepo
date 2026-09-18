// pages/nutrition-detail/nutrition-detail.js
const api = require('../../utils/api');
const app = getApp();

// 进度条宽度拼成 style 字符串：WXML 里写 "{{pct}}%" 会被样式校验报 semi-colon expected
const BAR_COLORS = {
  cal: '#FF9500', pro: '#FF6B35', car: '#07C160', fat: '#007AFF', fib: '#AF52DE'
};
function attachBarStyles(n) {
  Object.keys(BAR_COLORS).forEach(function (k) {
    n[k + 'BarStyle'] = 'width:' + n[k + 'Pct'] + '%;background:' + BAR_COLORS[k];
  });
  return n;
}

Page({
  data: {
    date: '',
    nutrition: {},
    history: [],
    suggestions: []
  },

  onLoad(options) {
    const date = options.date || '今日';
    this.setData({ date });
    this.loadData();
  },

  loadData() {
    // 第1步：从本地缓存加载
    const n = wx.getStorageSync('todayNutrition') || {
      calories: 1680, caloriesTarget: 2200,
      protein: 68, proteinTarget: 75,
      carbs: 210, carbsTarget: 280,
      fat: 48, fatTarget: 65,
      fiber: 18, fiberTarget: 25,
      score: 82
    };
    // 预计算百分比（WXML 里写除法在某些版本可能报错）
    n.calPct = Math.min(Math.round((n.calories / n.caloriesTarget) * 100), 100);
    n.proPct = Math.min(Math.round((n.protein / n.proteinTarget) * 100), 100);
    n.carPct = Math.min(Math.round((n.carbs / n.carbsTarget) * 100), 100);
    n.fatPct = Math.min(Math.round((n.fat / n.fatTarget) * 100), 100);
    n.fibPct = Math.min(Math.round((n.fiber / n.fiberTarget) * 100), 100);
    attachBarStyles(n);
    // 历史日期按当前时间动态生成（最近 5 天），不写死
    const mockHistory = [
      { offset: 0, score: 82, cal: 1680 },
      { offset: -1, score: 78, cal: 1760 },
      { offset: -2, score: 90, cal: 1600 },
      { offset: -3, score: 65, cal: 1560 },
      { offset: -4, score: 82, cal: 1980 }
    ].map(function(h) {
      const d = new Date();
      d.setDate(d.getDate() + h.offset);
      return {
        date: (d.getMonth() + 1) + '月' + d.getDate() + '日',
        score: h.score,
        cal: h.cal,
        scoreColor: h.score >= 80 ? '#07C160' : h.score >= 60 ? '#FF9500' : '#FF3B30'
      };
    });
    this.setData({
      nutrition: n,
      history: mockHistory,
      suggestions: [
        { text: '蛋白质摄入接近目标，继续保持', type: 'green' },
        { text: '膳食纤维偏低，建议增加蔬菜和水果', type: 'orange' },
        { text: '碳水摄入适中，选择低GI食物更好', type: 'blue' }
      ]
    });

    // 第2步：后台从服务器拉取最新数据
    const studentId = app.globalData.currentStudentId;
    if (studentId) {
      api.student.getTodayNutrition(studentId).then(function(nData) {
        if (nData) {
          wx.setStorageSync('todayNutrition', nData);
          nData.calPct = Math.min(Math.round((nData.calories / nData.caloriesTarget) * 100), 100);
          nData.proPct = Math.min(Math.round((nData.protein / nData.proteinTarget) * 100), 100);
          nData.carPct = Math.min(Math.round((nData.carbs / nData.carbsTarget) * 100), 100);
          nData.fatPct = Math.min(Math.round((nData.fat / nData.fatTarget) * 100), 100);
          nData.fibPct = Math.min(Math.round((nData.fiber / nData.fiberTarget) * 100), 100);
          attachBarStyles(nData);
          this.setData({ nutrition: nData });
        }
      }.bind(this)).catch(function() {});

      api.student.getNutritionHistory(studentId, 5).then(function(history) {
        if (history && history.length > 0) {
          const h = history.map(function(item, idx) {
            const d = new Date();
            d.setDate(d.getDate() - (history.length - 1 - idx));
            const dateStr = (d.getMonth() + 1) + '月' + d.getDate() + '日';
            const score = item.score || 80;
            return { date: dateStr, score: score, cal: item.calories, scoreColor: score >= 80 ? '#07C160' : (score >= 60 ? '#FF9500' : '#FF4D6A') };
          });
          this.setData({ history: h });
        }
      }.bind(this)).catch(function() {});
    }
  }
});
