// app.js
App({
  onLaunch() {
    const sysInfo = wx.getWindowInfo();
    this.globalData.statusBarHeight = sysInfo.statusBarHeight || 20;
    const savedId = wx.getStorageSync('studentId');
    if (savedId) {
      this.globalData.currentStudentId = parseInt(savedId);
    }

    // 检查登录状态
    // 注意：pages[0] 本来就是 pages/login/login，未登录时应用已经停留在登录页，
    // 这里**不能**再 wx.redirectTo 到登录页——那等于把正在渲染的启动页关掉再打开，
    // 冷启动时会偶发「标题栏在、页面内容空白」。登录成功后的跳转由 login.js 负责。
    const token = wx.getStorageSync('token');
    if (!token) {
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
