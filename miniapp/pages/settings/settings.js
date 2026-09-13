// pages/settings/settings.js
const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    type: 'goal',
    typeName: '',
    // 编辑资料
    profileForm: {
      name: '张三',
      id: '2023010042',
      college: '计算机学院',
      gender: '男',
      age: 20,
      avatar: '👨🏻',
      diet: '无限制'
    },
    genderOptions: ['男', '女', '非二元'],
    avatarOptions: [
      { emoji: '👨🏻', label: '浅肤色', color: '#fef3c7' },
      { emoji: '👩🏾', label: '深肤色', color: '#fce7f3' },
      { emoji: '👨🏼', label: '白皙肤色', color: '#ede9fe' },
      { emoji: '👩🏽', label: '小麦肤色', color: '#e0f2fe' },
      { emoji: '👨🏽', label: '自然肤色', color: '#fef9c3' },
      { emoji: '🧑🏻', label: '中性浅肤', color: '#f3e8ff' }
    ],
    dietOptions: ['无限制', '清真', '蛋奶素', '无麸质', '低敏'],
    // 饮食目标
    goalForm: {
      caloriesTarget: 2200,
      proteinTarget: 75,
      carbsTarget: 280,
      fatTarget: 65,
      fiberTarget: 25,
      goalType: '健康增重'
    },
    goalTypes: ['健康增重', '减脂塑形', '均衡饮食', '增肌增重'],
    // 过敏源
    allergyList: [],
    commonAllergies: ['花生', '牛奶', '鸡蛋', '海鲜', '大豆', '麸质', '坚果', '虾蟹', '芒果'],
    // 提醒设置
    remindForm: {
      breakfast: true,
      breakfastTime: '07:30',
      lunch: true,
      lunchTime: '11:30',
      dinner: true,
      dinnerTime: '17:30'
    },
    // 身体数据
    bodyForm: {
      height: 175,
      weight: 60,
      age: 20,
      gender: '男'
    },
    bmiValue: '19.6',
    bmiStatus: '正常',
    bmiColor: '#07C160',
    bmiPercent: 23,
    // 预计算索引（WXML 不能用 indexOf）
    genderIndex: 0,
    goalTypeIndex: 3,
    bodyGenderIndex: 0,
    allergyMap: {},
    avatarIndex: 0,
    dietIndex: 0
  },

  onLoad(options) {
    const type = options.type || 'goal';
    const typeNames = {
      goal: '饮食目标设置',
      allergy: '过敏源设置',
      remind: '用餐提醒',
      body: '身体数据',
      profile: '编辑资料'
    };
    this.setData({ type, typeName: typeNames[type] || '设置' });

    // 动态设置导航栏标题
    wx.setNavigationBarTitle({ title: typeNames[type] || '设置' });

    this.loadSettings();
  },

  loadSettings() {
    // 第1步：从本地缓存加载（快速显示）
    const saved = wx.getStorageSync('studentInfo');
    if (saved) {
      this.setData({
        'profileForm.name': saved.name || '张三',
        'profileForm.id': saved.id || '2023010042',
        'profileForm.college': saved.college || '计算机学院',
        'profileForm.gender': saved.gender || '男',
        'profileForm.age': saved.age || 20,
        'profileForm.avatar': saved.avatar || '👨🏻',
        'profileForm.diet': saved.diet || '无限制',
        'bodyForm.height': saved.height || 175,
        'bodyForm.weight': saved.weight || 60,
        'bodyForm.age': saved.age || 20,
        'bodyForm.gender': saved.gender || '男',
        'allergyList': saved.allergyList || []
      });
      this.calcBMI(saved.height || 175, saved.weight || 60);
    }
    const n = wx.getStorageSync('todayNutrition');
    if (n) {
      this.setData({
        'goalForm.caloriesTarget': n.caloriesTarget || 2200,
        'goalForm.proteinTarget': n.proteinTarget || 75,
        'goalForm.carbsTarget': n.carbsTarget || 280,
        'goalForm.fatTarget': n.fatTarget || 65,
        'goalForm.fiberTarget': n.fiberTarget || 25,
        'goalForm.goalType': n.goalType || '健康增重'
      });
    }
    const r = wx.getStorageSync('remindSettings');
    if (r) {
      this.setData({ remindForm: r });
    }
    this.updateComputed();

    // 第2步：从服务器拉取最新数据（后台刷新）
    const studentId = app.globalData.currentStudentId;
    if (studentId) {
      api.student.getInfo(studentId).then(function(data) {
        if (data) {
          // 合并服务端数据到本地缓存
          wx.setStorageSync('studentInfo', data);
          // 更新页面显示
          wx.getStorageSync('studentInfo'); // 重新读取确保一致性
          // 更新表单字段
          this.setData({
            'profileForm.name': data.name || this.data.profileForm.name,
            'profileForm.college': data.college || this.data.profileForm.college,
            'profileForm.gender': data.gender || this.data.profileForm.gender,
            'profileForm.age': data.age || this.data.profileForm.age,
            'profileForm.avatar': data.avatar || this.data.profileForm.avatar,
            'profileForm.diet': data.diet || this.data.profileForm.diet,
            'bodyForm.height': data.height || this.data.bodyForm.height,
            'bodyForm.weight': data.weight || this.data.bodyForm.weight,
            'bodyForm.age': data.age || this.data.bodyForm.age,
            'bodyForm.gender': data.gender || this.data.bodyForm.gender,
            'allergyList': data.allergyList || this.data.allergyList,
            'goalForm.goalType': data.goal || this.data.goalForm.goalType
          });
          this.calcBMI(data.height || this.data.bodyForm.height, data.weight || this.data.bodyForm.weight);
        }
      }.bind(this)).catch(function() {
        // 服务器不可用时静默失败，保留本地数据
        console.log('服务器未连接，使用本地数据');
      });

      // 从服务器拉取营养目标
      api.student.getTodayNutrition(studentId).then(function(nData) {
        if (nData) {
          wx.setStorageSync('todayNutrition', nData);
          this.setData({
            'goalForm.caloriesTarget': nData.caloriesTarget || this.data.goalForm.caloriesTarget,
            'goalForm.proteinTarget': nData.proteinTarget || this.data.goalForm.proteinTarget,
            'goalForm.carbsTarget': nData.carbsTarget || this.data.goalForm.carbsTarget,
            'goalForm.fatTarget': nData.fatTarget || this.data.goalForm.fatTarget,
            'goalForm.fiberTarget': nData.fiberTarget || this.data.goalForm.fiberTarget
          });
        }
      }.bind(this)).catch(function() {});
    }
  },

  // 更新所有 WXML 预计算字段（WXML 不支持 indexOf / 复杂运算）
  updateComputed() {
    const d = this.data;
    const gIdx = d.genderOptions.indexOf(d.profileForm.gender);
    const gtIdx = d.goalTypes.indexOf(d.goalForm.goalType);
    const bgIdx = d.genderOptions.indexOf(d.bodyForm.gender);
    const aIdx = d.avatarOptions.findIndex(function(o) { return o.emoji === d.profileForm.avatar; });
    const dIdx = d.dietOptions.indexOf(d.profileForm.diet);
    const map = {};
    for (let i = 0; i < d.allergyList.length; i++) { map[d.allergyList[i]] = true; }
    const bmi = parseFloat(d.bmiValue) || 0;
    const bmiPct = bmi < 15 ? 0 : bmi > 35 ? 100 : Math.round((bmi - 15) / 20 * 100);
    this.setData({
      genderIndex: gIdx >= 0 ? gIdx : 0,
      goalTypeIndex: gtIdx >= 0 ? gtIdx : 0,
      bodyGenderIndex: bgIdx >= 0 ? bgIdx : 0,
      allergyMap: map,
      bmiPercent: bmiPct,
      avatarIndex: aIdx >= 0 ? aIdx : 0,
      dietIndex: dIdx >= 0 ? dIdx : 0
    });
  },

  // 计算 BMI
  calcBMI(height, weight) {
    if (!height || !weight || height <= 0) return;
    const h = height / 100;
    const bmi = (weight / (h * h)).toFixed(1);
    let status = '正常';
    let color = '#07C160';
    if (bmi < 18.5) { status = '体重偏低'; color = '#007AFF'; }
    else if (bmi >= 28) { status = '体重偏高'; color = '#FF3B30'; }
    else if (bmi >= 24) { status = '偏胖'; color = '#FF9500'; }
    this.setData({ bmiValue: bmi, bmiStatus: status, bmiColor: color });
    this.updateComputed();
  },

  // 性别选择
  onGenderChange(e) {
    const idx = e.detail.value;
    const gender = this.data.genderOptions[idx];
    this.setData({ 'profileForm.gender': gender, 'bodyForm.gender': gender });
    this.updateComputed();
  },

  // 头像选择
  onAvatarChange(e) {
    const idx = e.currentTarget.dataset.idx;
    const avatar = this.data.avatarOptions[idx].emoji;
    this.setData({ 'profileForm.avatar': avatar });
    this.updateComputed();
  },

  // 饮食偏好选择
  onDietChange(e) {
    const idx = e.detail.value;
    const diet = this.data.dietOptions[idx];
    this.setData({ 'profileForm.diet': diet });
    this.updateComputed();
  },

  // 目标类型选择
  onGoalTypeChange(e) {
    const idx = e.detail.value;
    const type = this.data.goalTypes[idx];
    let form = Object.assign({}, this.data.goalForm);
    form.goalType = type;
    // 根据目标自动调整
    if (type === '减脂塑形') {
      form.caloriesTarget = 1800; form.proteinTarget = 90;
      form.carbsTarget = 200; form.fatTarget = 50;
    } else if (type === '增肌增重') {
      form.caloriesTarget = 2800; form.proteinTarget = 120;
      form.carbsTarget = 350; form.fatTarget = 80;
    } else if (type === '均衡饮食') {
      form.caloriesTarget = 2200; form.proteinTarget = 75;
      form.carbsTarget = 280; form.fatTarget = 65;
    } else if (type === '健康增重') {
      form.caloriesTarget = 2500; form.proteinTarget = 95;
      form.carbsTarget = 320; form.fatTarget = 70;
    }
    this.setData({ goalForm: form });
    this.updateComputed();
  },

  // 过敏源切换
  toggleAllergy(e) {
    const name = e.currentTarget.dataset.name;
    let list = this.data.allergyList.slice();
    const idx = list.indexOf(name);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(name);
    }
    this.setData({ allergyList: list });
    this.updateComputed();
  },

  // 提醒开关
  toggleRemind(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ ['remindForm.' + key]: !this.data.remindForm[key] });
  },

  // 时间选择
  onTimeChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ ['remindForm.' + key]: e.detail.value });
  },

  // 通用输入变化（自动区分数字和字符串）
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    let value = e.detail.value;
    // 数字类型字段自动转换
    const numFields = [
      'goalForm.caloriesTarget', 'goalForm.proteinTarget',
      'goalForm.carbsTarget', 'goalForm.fatTarget', 'goalForm.fiberTarget',
      'bodyForm.height', 'bodyForm.weight', 'bodyForm.age',
      'profileForm.age'
    ];
    if (numFields.indexOf(field) >= 0) {
      value = Number(value) || 0;
    }
    this.setData({ [field]: value });
    this.updateComputed();

    // 身高体重变化时实时更新BMI
    if (field === 'bodyForm.height' || field === 'bodyForm.weight') {
      this.calcBMI(
        field === 'bodyForm.height' ? value : this.data.bodyForm.height,
        field === 'bodyForm.weight' ? value : this.data.bodyForm.weight
      );
    }
  },

  // 保存
  saveSettings() {
    const type = this.data.type;
    const info = wx.getStorageSync('studentInfo') || {};

    if (type === 'profile') {
      info.name = this.data.profileForm.name;
      info.id = this.data.profileForm.id;
      info.college = this.data.profileForm.college;
      info.gender = this.data.profileForm.gender;
      info.age = this.data.profileForm.age;
      info.avatar = this.data.profileForm.avatar;
      info.diet = this.data.profileForm.diet;
      wx.setStorageSync('studentInfo', info);
    } else if (type === 'goal') {
      const n = wx.getStorageSync('todayNutrition') || {};
      n.caloriesTarget = Number(this.data.goalForm.caloriesTarget) || 2200;
      n.proteinTarget = Number(this.data.goalForm.proteinTarget) || 75;
      n.carbsTarget = Number(this.data.goalForm.carbsTarget) || 280;
      n.fatTarget = Number(this.data.goalForm.fatTarget) || 65;
      n.fiberTarget = Number(this.data.goalForm.fiberTarget) || 25;
      n.goalType = this.data.goalForm.goalType;
      wx.setStorageSync('todayNutrition', n);
      info.goal = this.data.goalForm.goalType;
      wx.setStorageSync('studentInfo', info);
    } else if (type === 'allergy') {
      info.allergyList = this.data.allergyList;
      wx.setStorageSync('studentInfo', info);
    } else if (type === 'body') {
      info.height = Number(this.data.bodyForm.height) || 175;
      info.weight = Number(this.data.bodyForm.weight) || 60;
      info.age = Number(this.data.bodyForm.age) || 20;
      info.gender = this.data.bodyForm.gender;
      info.bmi = this.data.bmiValue;
      wx.setStorageSync('studentInfo', info);
    } else if (type === 'remind') {
      wx.setStorageSync('remindSettings', this.data.remindForm);
    }

    // 同步到服务器（最佳努力，不阻塞用户）
    const studentId = app.globalData.currentStudentId;
    if (studentId && type !== 'remind') {
      api.student.updateInfo(studentId, info).catch(function() {
        console.log('服务器同步失败，数据已保存到本地');
      });
    }
    // 提醒设置单独同步
    if (type === 'remind' && studentId) {
      api.put('/api/students/' + studentId + '/remind', this.data.remindForm).catch(function() {});
    }

    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1000);
  }
});
