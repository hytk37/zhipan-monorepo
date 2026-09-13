// app.js
App({
  onLaunch() {
    const sysInfo = wx.getWindowInfo();
    this.globalData.statusBarHeight = sysInfo.statusBarHeight || 20;
    const savedId = wx.getStorageSync('studentId');
    if (savedId) {
      this.globalData.currentStudentId = parseInt(savedId);
    }

    // 检查登录状态，未登录跳转登录页
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }

    // 模拟数据初始化（仅登录后执行）
    this.initMockData();
  },

  initMockData() {
    // 如果没有本地数据，初始化模拟数据
    if (!wx.getStorageSync('studentInfo')) {
      wx.setStorageSync('studentInfo', {
        id: 2023010042,
        name: '张三',
        college: '计算机学院',
        avatar: '👨🏻',
        diet: '无限制',
        height: 175,
        weight: 60,
        bmi: 19.6,
        goal: '健康增重',
        level: 3,
        checkDays: 23,
        avgScore: 82,
        allergyList: ['花生']
      });
    }
    if (!wx.getStorageSync('todayNutrition')) {
      wx.setStorageSync('todayNutrition', {
        calories: 1680,
        caloriesTarget: 2200,
        protein: 68,
        proteinTarget: 75,
        carbs: 210,
        carbsTarget: 280,
        fat: 48,
        fatTarget: 65,
        fiber: 18,
        fiberTarget: 25,
        score: 82,
        checked: false
      });
    }
  },

  globalData: {
    apiBase: 'http://localhost:3000',
    currentStudentId: 0,
    statusBarHeight: 20,
    tabSelected: 0
  }
});
