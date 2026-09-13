// pages/recommend/recommend.js
const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    categories: [
      { key: 'all', name: '全部' },
      { key: 'high-protein', name: '高蛋白' },
      { key: 'low-cal', name: '低热量' },
      { key: 'veggie', name: '素食' },
      { key: 'muscle', name: '增肌' },
      { key: 'halal', name: '清真' },
      { key: 'culture', name: '多元' }
    ],
    currentCat: 'all',
    // 用户画像
    userProfile: {
      bmi: 19.6,
      bmiStatus: '偏瘦',
      goal: '健康增重',
      lackNutrient: '蛋白质、膳食纤维'
    },
    // AI 个性化推荐方案
    aiPlan: {
      title: '增重营养方案',
      totalCal: 2500,
      foods: [
        { id: 101, emoji: '🍗', name: '红烧鸡胸肉', cal: '320kcal', protein: '35g', reason: '高蛋白低脂肪，增肌首选' },
        { id: 102, emoji: '🥚', name: '水煮蛋×2', cal: '150kcal', protein: '12g', reason: '优质蛋白质来源' },
        { id: 103, emoji: '🍚', name: '糙米饭', cal: '210kcal', protein: '5g', reason: '低GI，持续供能' },
        { id: 104, emoji: '🥦', name: '清炒西兰花', cal: '80kcal', protein: '4g', reason: '补充膳食纤维和维生素C' }
      ]
    },
    // 食堂精选
    chefPicks: [
      { id: 10, emoji: '🍜', name: '牛肉拉面', desc: '蛋白质 35g · 热量 580kcal', tags: [{ text: '人气王', type: 'green' }, { text: '高蛋白', type: 'green' }], cat: 'high-protein', diet: [] },
      { id: 11, emoji: '🥗', name: '轻食沙拉套餐', desc: '热量 320kcal · 适合控制体重', tags: [{ text: '低卡', type: 'blue' }, { text: '轻食', type: 'green' }], cat: 'low-cal', diet: [] },
      { id: 12, emoji: '🍲', name: '番茄炖牛腩', desc: '蛋白质 42g · 补充铁和锌', tags: [{ text: '补铁', type: 'blue' }, { text: '高蛋白', type: 'green' }], cat: 'high-protein', diet: [] },
      { id: 13, emoji: '🥬', name: '素炒时蔬拼盘', desc: '膳食纤维 8g · 热量 120kcal', tags: [{ text: '素食', type: 'green' }, { text: '低卡', type: 'blue' }], cat: 'veggie', diet: ['素食'] },
      { id: 14, emoji: '🥩', name: '黑椒牛排', desc: '蛋白质 48g · 热量 420kcal', tags: [{ text: '增肌', type: 'green' }, { text: '高蛋白', type: 'green' }], cat: 'muscle', diet: [] },
      { id: 15, emoji: '🌽', name: '玉米山药粥', desc: '碳水 40g · 热量 260kcal', tags: [{ text: '素食', type: 'green' }, { text: '养胃', type: 'blue' }], cat: 'veggie', diet: ['素食'] },
      { id: 16, emoji: '🍛', name: '咖喱蔬菜配鹰嘴豆', desc: '蛋白质 18g · 热量 320kcal · 南亚风味', tags: [{ text: '素食', type: 'green' }, { text: '高纤维', type: 'blue' }], cat: 'culture', diet: ['素食', '清真', '无麸质'] },
      { id: 17, emoji: '🐟', name: '清蒸鲈鱼', desc: '蛋白质 45g · 热量 280kcal · 低脂', tags: [{ text: '高蛋白', type: 'green' }, { text: '低脂', type: 'blue' }], cat: 'high-protein', diet: ['清真'] },
      { id: 18, emoji: '🥟', name: '清真牛肉蒸饺', desc: '蛋白质 20g · 热量 350kcal · 清真认证', tags: [{ text: '清真', type: 'green' }, { text: '人气王', type: 'green' }], cat: 'halal', diet: ['清真'] },
      { id: 19, emoji: '🥘', name: '咖喱鸡肉（清真）', desc: '蛋白质 42g · 热量 420kcal · 异域风味', tags: [{ text: '清真', type: 'green' }, { text: '高蛋白', type: 'green' }], cat: 'halal', diet: ['清真'] },
      { id: 20, emoji: '🥣', name: '藜麦蔬菜碗', desc: '膳食纤维 10g · 热量 280kcal · 无麸质', tags: [{ text: '素食', type: 'green' }, { text: '无麸质', type: 'orange' }], cat: 'culture', diet: ['素食', '无麸质', '低敏'] },
      { id: 21, emoji: '🥜', name: '凉拌木耳菠菜', desc: '膳食纤维 6g · 热量 150kcal · 清爽开胃', tags: [{ text: '素食', type: 'green' }, { text: '低卡', type: 'blue' }], cat: 'veggie', diet: ['素食', '清真', '无麸质', '低敏'] },
      { id: 22, emoji: '🍝', name: '番茄鸡蛋炒意面', desc: '碳水 55g · 热量 390kcal · 蛋奶素', tags: [{ text: '蛋奶素', type: 'purple' }, { text: '均衡', type: 'blue' }], cat: 'culture', diet: ['蛋奶素'] }
    ],
    // 营养知识
    tips: [
      { title: '蛋白质摄入时机', content: '运动后30分钟内摄入蛋白质，肌肉合成效率最高', icon: '💪' },
      { title: '碳水不是敌人', content: '适量碳水是大脑和肌肉的主要能量来源，不要盲目断碳', icon: '🍞' },
      { title: '水分补充', content: '每天至少饮水1500ml，有助于新陈代谢和营养吸收', icon: '💧' }
    ],
    // 饮食偏好标签样式映射
    dietTags: [],
    dietTagStyles: {
      '清真': 'background:rgba(22,163,74,.1);color:#16a34a;border:1px solid rgba(22,163,74,.2)',
      '素食': 'background:rgba(124,58,237,.1);color:#7c3aed;border:1px solid rgba(124,58,237,.2)',
      '蛋奶素': 'background:rgba(124,58,237,.1);color:#7c3aed;border:1px solid rgba(124,58,237,.2)',
      '无麸质': 'background:rgba(234,88,12,.1);color:#ea580c;border:1px solid rgba(234,88,12,.2)',
      '低敏': 'background:rgba(13,148,136,.1);color:#0d9488;border:1px solid rgba(13,148,136,.2)'
    },
    userDiet: '无限制'
  },

  onLoad() {
    this.loadRecommendations();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadUserDiet();
  },

  // 从服务器加载推荐方案
  loadRecommendations() {
    const studentId = app.globalData.currentStudentId;
    if (!studentId) return;
    api.food.getRecommendations(studentId).then(function(data) {
      if (data && data.length > 0) {
        const foods = data.map(function(f, i) {
          return {
            id: i + 201, emoji: '🍽️', name: f.name,
            cal: f.score + '分', protein: (f.tags || []).join('、'),
            reason: f.desc || ''
          };
        });
        this.setData({ 'aiPlan.foods': foods });
      }
    }.bind(this)).catch(function() {
      // 服务器不可用，保留硬编码数据
      console.log('推荐菜品服务器未连接，使用本地数据');
    });
  },

  // 加载用户饮食偏好并计算推荐的饮食标签
  loadUserDiet() {
    const saved = wx.getStorageSync('studentInfo');
    if (saved) {
      // 更新用户画像信息
      const bmi = saved.bmi || (saved.height && saved.weight ?
        (saved.weight / ((saved.height / 100) * (saved.height / 100))).toFixed(1) : '—');
      let bmiStatus = '正常';
      if (bmi < 18.5) bmiStatus = '体重偏低';
      else if (bmi >= 28) bmiStatus = '体重偏高';
      else if (bmi >= 24) bmiStatus = '偏胖';

      const diet = saved.diet || '无限制';
      const styles = this.data.dietTagStyles;
      const tags = [];
      if (diet !== '无限制') {
        tags.push({ label: '🟢 ' + diet + '可选', style: styles[diet] || '' });
      } else {
        tags.push({ label: '🟢 清真可选', style: styles['清真'] });
        tags.push({ label: '🟣 素食可选', style: styles['素食'] });
        tags.push({ label: '🟠 无麸质可选', style: styles['无麸质'] });
        tags.push({ label: '🔵 低敏可选', style: styles['低敏'] });
      }

      this.setData({
        userDiet: diet,
        dietTags: tags,
        'userProfile.bmi': bmi,
        'userProfile.bmiStatus': bmiStatus,
        'userProfile.goal': saved.goal || '均衡饮食'
      });
    }
  },

  // 切换分类
  switchCategory(e) {
    const cat = e.currentTarget.dataset.cat;
    this.setData({ currentCat: cat });
  },

  // 查看菜品详情
  goFoodDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/food-detail/food-detail?id=' + id });
  },

  // 采纳推荐方案
  adoptPlan() {
    wx.showModal({
      title: '采纳推荐方案',
      content: '将此方案设为今日饮食目标？',
      success: (res) => {
        if (res.confirm) {
          // 更新今日营养目标
          const n = wx.getStorageSync('todayNutrition') || {};
          n.caloriesTarget = 2500;
          n.proteinTarget = 90;
          wx.setStorageSync('todayNutrition', n);
          wx.showToast({ title: '已设为今日目标', icon: 'success' });
        }
      }
    });
  },

  // 查看营养知识
  showTip(e) {
    const idx = e.currentTarget.dataset.index;
    const tip = this.data.tips[idx];
    wx.showModal({
      title: tip.icon + ' ' + tip.title,
      content: tip.content,
      showCancel: false,
      confirmText: '了解了'
    });
  },

  // 获取筛选后的菜品列表
  getFilteredPicks() {
    const cat = this.data.currentCat;
    if (cat === 'all') return this.data.chefPicks;
    return this.data.chefPicks.filter(f => f.cat === cat);
  }
});
