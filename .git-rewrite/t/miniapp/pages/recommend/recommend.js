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
    // AI 个性化推荐方案（菜品来自第13周真实食谱）
    aiPlan: {
      title: '增重营养方案',
      totalCal: 2500,
      foods: [
        { id: 101, emoji: '🍗', name: '粉蒸鸡腿', cal: '420kcal', protein: '27g', reason: '高蛋白，蒸制少油，增肌首选' },
        { id: 102, emoji: '🥚', name: '营养蛋×2', cal: '150kcal', protein: '14g', reason: '优质蛋白质来源，早餐每日供应' },
        { id: 103, emoji: '🍚', name: '红薯饭', cal: '250kcal', protein: '5g', reason: '粗粮低GI，持续供能' },
        { id: 104, emoji: '🥦', name: '蒜蓉西兰花', cal: '85kcal', protein: '4g', reason: '补充膳食纤维和维生素C' }
      ]
    },
    // 食堂精选（全部来自本周真实食谱）
    chefPicks: [
      { id: 1, emoji: '🍖', name: '干锅排骨', desc: '蛋白质 24g · 热量 420kcal · 周一午餐招牌', tags: [{ text: '人气王', type: 'green' }, { text: '高蛋白', type: 'green' }], cat: 'high-protein', diet: [] },
      { id: 17, emoji: '🥩', name: '番茄牛腩', desc: '蛋白质 26g · 补充铁和锌', tags: [{ text: '补铁', type: 'blue' }, { text: '高蛋白', type: 'green' }], cat: 'high-protein', diet: [] },
      { id: 19, emoji: '🐟', name: '豆花龙利鱼', desc: '蛋白质 24g · 热量 240kcal · 低脂', tags: [{ text: '高蛋白', type: 'green' }, { text: '低脂', type: 'blue' }], cat: 'high-protein', diet: [] },
      { id: 2, emoji: '🥦', name: '蒜蓉西兰花', desc: '膳食纤维 4.5g · 热量 85kcal', tags: [{ text: '素食', type: 'green' }, { text: '低卡', type: 'blue' }], cat: 'veggie', diet: ['素食', '低敏'] },
      { id: 15, emoji: '🌽', name: '双椒玉米', desc: '碳水 19g · 热量 130kcal · 粗粮', tags: [{ text: '素食', type: 'green' }, { text: '粗粮', type: 'blue' }], cat: 'veggie', diet: ['素食'] },
      { id: 3, emoji: '🍚', name: '玉米饭', desc: '碳水 54g · 膳食纤维 4g', tags: [{ text: '粗粮', type: 'green' }, { text: '低GI', type: 'blue' }], cat: 'veggie', diet: ['素食'] },
      { id: 9, emoji: '🍗', name: '卤鸡腿', desc: '蛋白质 26g · 热量 310kcal', tags: [{ text: '增肌', type: 'green' }, { text: '高蛋白', type: 'green' }], cat: 'muscle', diet: [] },
      { id: 16, emoji: '🌶️', name: '水煮肉片', desc: '蛋白质 26g · 川味经典', tags: [{ text: '高蛋白', type: 'green' }, { text: '人气王', type: 'blue' }], cat: 'muscle', diet: [] },
      { id: 21, emoji: '🥩', name: '萝卜烧牛腩', desc: '蛋白质 24g · 热量 350kcal · 清炖少油', tags: [{ text: '清真', type: 'green' }, { text: '高蛋白', type: 'green' }], cat: 'halal', diet: ['清真'] },
      { id: 20, emoji: '🐰', name: '山椒兔', desc: '蛋白质 26g · 热量 260kcal · 高蛋白低脂', tags: [{ text: '清真', type: 'green' }, { text: '低脂', type: 'blue' }], cat: 'halal', diet: ['清真'] },
      { id: 10, emoji: '🍜', name: '素椒杂酱面', desc: '碳水 72g · 热量 520kcal · 干拌川味', tags: [{ text: '人气王', type: 'green' }, { text: '主食', type: 'blue' }], cat: 'culture', diet: [] },
      { id: 14, emoji: '🍛', name: '台式卤肉盖浇饭', desc: '蛋白质 22g · 热量 680kcal · 分量足', tags: [{ text: '人气王', type: 'green' }, { text: '主食', type: 'blue' }], cat: 'culture', diet: [] },
      { id: 5, emoji: '🍲', name: '银耳汤', desc: '热量 60kcal · 低卡润燥', tags: [{ text: '素食', type: 'green' }, { text: '低卡', type: 'blue' }], cat: 'low-cal', diet: ['素食', '低敏'] }
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
