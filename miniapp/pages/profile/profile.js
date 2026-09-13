// pages/profile/profile.js
const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    userInfo: {
      name: '张三',
      id: '2023010042',
      college: '计算机学院',
      avatar: '',
      height: 175,
      weight: 60,
      bmi: 19.6,
      goal: '健康增重',
      level: 3,
      checkDays: 23,
      avgScore: 82,
      allergyList: ['花生']
    },
    // 营养等级
    levelInfo: {
      name: '营养达人',
      nextLevel: 'Lv.4',
      progress: 65,
      needDays: 7
    },
    // 菜单列表
    menus: [
      { icon: '📊', title: '我的营养报告', url: '/pages/nutrition-detail/nutrition-detail', desc: '查看今日营养详情' },
      { icon: '🎯', title: '饮食目标设置', url: '/pages/settings/settings?type=goal', desc: '设定你的饮食计划' },
      { icon: '⚠️', title: '过敏源设置', url: '/pages/settings/settings?type=allergy', desc: '管理食物过敏源' },
      { icon: '🔔', title: '用餐提醒', url: '/pages/settings/settings?type=remind', desc: '设置三餐提醒时间' },
      { icon: '📐', title: '身体数据', url: '/pages/settings/settings?type=body', desc: '身高体重BMI' },
      { icon: '❓', title: '帮助与反馈', url: '', desc: '常见问题与意见反馈' }
    ],
    // 成就列表
    achievements: [
      { icon: '🔥', name: '连续打卡7天', unlocked: true, desc: '连续7天记录用餐' },
      { icon: '🥗', name: '蔬菜达标周', unlocked: true, desc: '一周蔬菜摄入均达标' },
      { icon: '💪', name: '蛋白质达标月', unlocked: false, desc: '一月蛋白质均达标' },
      { icon: '🏆', name: '营养评分90+', unlocked: false, desc: '获得90分以上评分' }
    ],
    // 打卡日历
    weekDays: ['一', '二', '三', '四', '五', '六', '日'],
    weekCheck: [true, true, true, false, false, false, false],
    weekCheckCount: 3,
    achievementUnlockedCount: 2
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    this.loadUserInfo();
  },

  // 加载用户信息（从本地存储 + 服务器同步）
  loadUserInfo() {
    const saved = wx.getStorageSync('studentInfo');
    if (saved) {
      this._applyUserInfo(saved);
    }
    // 后台从服务器拉取最新数据
    const studentId = app.globalData.currentStudentId;
    if (studentId) {
      api.student.getInfo(studentId).then(function(data) {
        if (data) {
          wx.setStorageSync('studentInfo', data);
          this._applyUserInfo(data);
        }
      }.bind(this)).catch(function() {
        console.log('服务器未连接，使用本地数据');
      });
    }
  },

  _applyUserInfo(saved) {
    if (saved) {
      const bmi = saved.bmi || (saved.height && saved.weight ?
        (saved.weight / ((saved.height / 100) * (saved.height / 100))).toFixed(1) : '—');

      // 根据打卡天数计算等级
      const checkDays = saved.checkDays || 23;
      let level = 1;
      let levelName = '营养新手';
      let nextLevel = 'Lv.2';
      let progress = 0;
      let needDays = 5;
      if (checkDays >= 60) { level = 5; levelName = '营养大师'; nextLevel = 'MAX'; progress = 100; needDays = 0; }
      else if (checkDays >= 40) { level = 4; levelName = '营养专家'; nextLevel = 'Lv.5'; progress = Math.round((checkDays - 40) / 20 * 100); needDays = 60 - checkDays; }
      else if (checkDays >= 20) { level = 3; levelName = '营养达人'; nextLevel = 'Lv.4'; progress = Math.round((checkDays - 20) / 20 * 100); needDays = 40 - checkDays; }
      else if (checkDays >= 7) { level = 2; levelName = '营养学徒'; nextLevel = 'Lv.3'; progress = Math.round((checkDays - 7) / 13 * 100); needDays = 20 - checkDays; }
      else { level = 1; levelName = '营养新手'; nextLevel = 'Lv.2'; progress = Math.round(checkDays / 7 * 100); needDays = 7 - checkDays; }

      // 成就解锁逻辑
      let achievements = this.data.achievements.slice();
      achievements[0].unlocked = checkDays >= 7;
      achievements[1].unlocked = checkDays >= 14;
      achievements[2].unlocked = checkDays >= 30;
      achievements[3].unlocked = (saved.avgScore || 82) >= 90;

      // 预计算 WXML 需要的字段（不能用 filter/箭头函数）
      const weekCheck = saved.weekCheck || [true, true, true, false, false, false, false];
      let checkCnt = 0;
      for (let i = 0; i < weekCheck.length; i++) { if (weekCheck[i]) checkCnt++; }
      let unlockedCnt = 0;
      for (let i = 0; i < achievements.length; i++) { if (achievements[i].unlocked) unlockedCnt++; }

      this.setData({
        userInfo: Object.assign({}, this.data.userInfo, saved, { bmi }),
        levelInfo: { name: levelName, nextLevel, progress, needDays },
        achievements,
        weekCheck: weekCheck,
        weekCheckCount: checkCnt,
        achievementUnlockedCount: unlockedCnt
      });
    }
  },

  // 菜单点击
  onMenuTap(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) {
      wx.showModal({
        title: '帮助与反馈',
        content: '如有问题，请联系食堂管理处\n\n📧 贺宇桐\n📞 54188\n工作时间：周一至周五 9:00-17:00',
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    wx.navigateTo({ url });
  },

  // 查看成就详情
  showAchievement(e) {
    const idx = e.currentTarget.dataset.index;
    const ach = this.data.achievements[idx];
    wx.showModal({
      title: ach.icon + ' ' + ach.name,
      content: ach.unlocked ? '🎉 恭喜你已解锁此成就！\n\n' + ach.desc : '🔒 尚未解锁\n\n' + ach.desc + '\n\n继续加油！',
      showCancel: false,
      confirmText: '好的'
    });
  },

  // 编辑个人信息
  editProfile() {
    wx.navigateTo({ url: '/pages/settings/settings?type=profile' });
  },

  // 查看营养报告
  viewNutritionReport() {
    wx.navigateTo({ url: '/pages/nutrition-detail/nutrition-detail' });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: 'HX系统 - 校园营养管家',
      path: '/pages/index/index'
    };
  }
});
