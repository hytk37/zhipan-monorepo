/**
 * HX系统 · 冒险模式 - 主页面逻辑
 */
const { THEMES, THEME_DOTS } = require('../../utils/game-theme.js')
const app = getApp()

Page({
  data: {
    // 主题
    currentTheme: 'cyber',
    showThemePanel: false,
    darkThemeDots: THEME_DOTS.filter(d => d.section === 'dark'),
    lightThemeDots: THEME_DOTS.filter(d => d.section === 'light'),
    themeStyle: '', // 动态 CSS 变量 inline style

    // 导航栏
    statusBarHeight: 0,
    navBarHeight: 0,

    // Tab
    currentTab: 0,
    tabs: [
      { icon: '🗺️', label: '冒险地图' },
      { icon: '⚔️', label: '状态面板' },
      { icon: '🏪', label: '补给站' },
      { icon: '👤', label: '冒险者' }
    ],

    // 游戏数据
    level: 5,
    exp: 1280,
    expMax: 2000,
    coins: '0',
    energy: 86,
    levelText: 'Lv.5',
    streak: 4,

    // 任务
    quests: [
      { name: '摄入蛋白质 ≥ 75g', reward: '+30 💰 · +15 EXP', progress: 90, color: 'hp', done: true,  rewarded: true,  barStyle: 'width:90%;background:var(--hp)' },
      { name: '膳食纤维达标 ≥ 25g', reward: '+20 💰 · +10 EXP', progress: 72, color: 'mp', done: false, rewarded: false, barStyle: 'width:72%;background:#ab47bc' },
      { name: '热量控制 1800~2200kcal', reward: '+25 💰 · +20 EXP', progress: 76, color: 'exp', done: false, rewarded: false, barStyle: 'width:76%;background:var(--exp)' },
      { name: '打卡记录三餐', reward: '+10 💰 · +5 EXP', progress: 67, color: 'mp', done: false, rewarded: false, barStyle: 'width:67%;background:var(--mp)' }
    ],

    // 今日装备列表
    todayEquipList: [],
    todayEquipCount: 0,

    // 地图节点（rpx定位）
    mapNodes: [],
    mapLines: [],
    playerLeft: '',
    playerTop: '',
    mapCanvasHeight: 0,

    // 状态面板
    stats: [
      { icon: '🔥', label: 'HP 热量', color: 'hp', current: 1680, max: 2200, unit: 'kcal', pct: 76, labelStyle: 'color:var(--hp)' },
      { icon: '🥩', label: 'MP 蛋白质', color: 'mp', current: 68, max: 75, unit: 'g', pct: 91, labelStyle: 'color:var(--mp)' },
      { icon: '🍞', label: 'EXP 碳水', color: 'exp', current: 210, max: 280, unit: 'g', pct: 75, labelStyle: 'color:var(--exp)' },
      { icon: '🥬', label: 'FIB 膳食纤维', color: 'fiber', current: 18, max: 25, unit: 'g', pct: 72, labelStyle: 'color:#ab47bc' }
    ],
    // 本周营养趋势数据
    weekTrend: [
      { day: '周一', cal: 1920, pro: 72, carb: 240, fib: 22 },
      { day: '周二', cal: 1850, pro: 65, carb: 225, fib: 18 },
      { day: '周三', cal: 2100, pro: 78, carb: 260, fib: 24 },
      { day: '周四', cal: 1750, pro: 58, carb: 210, fib: 15 },
      { day: '周五', cal: 1680, pro: 68, carb: 210, fib: 18 },
      { day: '周六', cal: 0, pro: 0, carb: 0, fib: 0 },
      { day: '周日', cal: 0, pro: 0, carb: 0, fib: 0 }
    ],
    buffs: [
      { text: '🛡️ 高蛋白加成', type: 'good', detail: '蛋白质摄入达标，促进肌肉合成与修复，增强免疫力，维持皮肤和毛发健康。当前状态：摄入充足，身体处于正向氮平衡。' },
      { text: '⚡ 低碳水增益', type: 'good', detail: '碳水化合物控制在合理范围，有助于稳定血糖水平，减少脂肪堆积，同时为大脑和神经系统提供充足能量。' },
      { text: '⚠️ 纤维不足', type: 'warn', detail: '膳食纤维摄入低于推荐量，可能导致便秘、肠道菌群失衡。长期缺乏会增加结肠疾病风险。建议增加蔬菜、水果和全谷物摄入。' },
      { text: '🧊 脂肪偏低', type: 'bad', detail: '脂肪摄入不足可能影响脂溶性维生素(A/D/E/K)的吸收，导致皮肤干燥、激素分泌紊乱。建议适量补充坚果、鱼类等健康脂肪。' }
    ],
    attrs: [
      { icon: '💪', name: '力量·蛋白', val: 91, colorVar: 'hp', valStyle: 'color:var(--hp)', barStyle: 'width:91%;background:var(--hp)', detail: '蛋白质是肌肉生长和修复的核心营养素。充足的蛋白质摄入有助于增强体力、提升运动表现，并参与酶和激素的合成。' },
      { icon: '🏃', name: '敏捷·碳水', val: 75, colorVar: 'exp', valStyle: 'color:var(--exp)', barStyle: 'width:75%;background:var(--exp)', detail: '碳水化合物是身体的主要能量来源。合理的碳水摄入能维持血糖稳定，为大脑供能，支持高强度运动和日常活动的敏捷性。' },
      { icon: '🧠', name: '智力·纤维', val: 72, colorVar: 'hp', valStyle: 'color:#ab47bc', barStyle: 'width:72%;background:#ab47bc', detail: '膳食纤维促进肠道蠕动，维持消化系统健康。肠道被称为"第二大脑"，良好的肠道环境有助于营养吸收和神经递质平衡，间接提升认知能力。' },
      { icon: '❤️', name: '体质·脂肪', val: 74, colorVar: 'mp', valStyle: 'color:var(--mp)', barStyle: 'width:74%;background:var(--mp)', detail: '脂肪是细胞膜的重要组成，参与激素调节和体温维持。适量的健康脂肪(不饱和脂肪酸)有助于心血管健康，降低炎症反应。' },
      { icon: '🔥', name: '耐力·热量', val: 76, colorVar: 'fire', valStyle: 'color:var(--fire)', barStyle: 'width:76%;background:var(--fire)', detail: '热量摄入决定身体的能量储备。适度的热量能够支撑日常活动和新陈代谢，维持体温恒定。热量过高或过低都会影响身体机能。' },
      { icon: '⭐', name: '综合评分', val: 82, colorVar: 'gold', valStyle: 'color:var(--gold)', barStyle: 'width:82%;background:var(--gold)', detail: '综合评分反映整体营养均衡程度，综合蛋白质、碳水、脂肪、纤维和热量的达标情况。评分越高，代表当日饮食越科学均衡。' }
    ],

    // 宝箱
    chestOpened: false,
    chestLabel: '🎁 今日宝箱 · 点击开启',

    // 每日特供
    dailyFoods: [
      { emoji: '🥩', name: '暗黑牛排', desc: '蛋白质 42g · 450kcal', rarity: '传说', rarityClass: 'legend', rarityText: '★ 传说', detail: '🔥 传说级高蛋白，增肌勇士的不二之选', protein: '42g', carb: '12g', fat: '18g' },
      { emoji: '🥗', name: '生命之树沙拉', desc: '膳食纤维 8g · 120kcal', rarity: '史诗', rarityClass: 'epic', rarityText: '★ 史诗', detail: '✨ 史诗级纤维补给，守护肠道健康', protein: '4g', carb: '8g', fat: '3g' }
    ],
    recommendedFoods: [
      { emoji: '🍗', name: '骑士鸡腿', desc: '蛋白质 28g · 320kcal', rarity: '稀有', rarityClass: 'rare', rarityText: '★ 稀有', detail: '🛡️ 稀有级蛋白质，均衡营养之选', protein: '28g', carb: '15g', fat: '12g' },
      { emoji: '🥦', name: '守护者西兰花', desc: '膳食纤维 5g · 80kcal', rarity: '稀有', rarityClass: 'rare', rarityText: '★ 稀有', detail: '💚 稀有级纤维，低卡守护健康', protein: '5g', carb: '8g', fat: '1g' },
      { emoji: '🍚', name: '稳定谷物饭', desc: '碳水 45g · 210kcal', rarity: '普通', rarityClass: 'common', rarityText: '☆ 普通', detail: '🌾 普通级低GI碳水，稳扎稳打', protein: '4g', carb: '45g', fat: '2g' },
      { emoji: '🥚', name: '新手蒸蛋', desc: '蛋白质 12g · 120kcal', rarity: '普通', rarityClass: 'common', rarityText: '☆ 普通', detail: '🐣 普通级易消化蛋白，入门之选', protein: '12g', carb: '2g', fat: '8g' },
      { emoji: '🍜', name: '龙息拉面', desc: '蛋白质 32g · 580kcal', rarity: '史诗', rarityClass: 'epic', rarityText: '★ 史诗', detail: '🐉 史诗级组合，蛋白质与碳水的完美融合', protein: '32g', carb: '65g', fat: '18g' },
      { emoji: '🌽', name: '远古玉米', desc: '碳水 30g · 180kcal', rarity: '普通', rarityClass: 'common', rarityText: '☆ 普通', detail: '🌽 普通级粗粮，低GI长续航', protein: '4g', carb: '30g', fat: '2g' }
    ],

    // 档案
    profileName: '张三',
    profileCollege: '计算机学院',
    profileId: '2023010042',
    profileGender: 'male',
    profileAge: 20,
    equipSlots: [
      { icon: '🗡️', label: '蛋白剑', filled: true },
      { icon: '🛡️', label: '纤维盾', filled: true },
      { icon: '💍', label: '碳水戒', filled: true },
      { icon: '➕', label: '空槽', filled: false }
    ],
    profileAttrs: [
      { icon: '💪', name: '力量 STR', val: 91, colorVar: 'hp', valStyle: 'color:var(--hp)', barStyle: 'width:91%;background:var(--hp)' },
      { icon: '🏃', name: '敏捷 AGI', val: 75, colorVar: 'exp', valStyle: 'color:var(--exp)', barStyle: 'width:75%;background:var(--exp)' },
      { icon: '🧠', name: '智力 INT', val: 72, colorVar: 'hp', valStyle: 'color:#ab47bc', barStyle: 'width:72%;background:#ab47bc' },
      { icon: '❤️', name: '体质 VIT', val: 74, colorVar: 'mp', valStyle: 'color:var(--mp)', barStyle: 'width:74%;background:var(--mp)' }
    ],
    bmiVal: '19.6',
    achievements: [
      { icon: '🌟', name: '初出茅庐', unlocked: true },
      { icon: '🔥', name: '连续7天', unlocked: true },
      { icon: '💪', name: '蛋白达人', unlocked: true },
      { icon: '🥬', name: '纤维战士', unlocked: true },
      { icon: '🏆', name: '满分勇者', unlocked: false },
      { icon: '⚡', name: '连续30天', unlocked: false },
      { icon: '🐉', name: '传说厨师', unlocked: false },
      { icon: '👑', name: '健康之王', unlocked: false }
    ],
    menuItems: [
      { icon: '✏️', name: '编辑角色', desc: '修改姓名、学院等信息', modal: 'profile' },
      { icon: '🎯', name: '战斗目标', desc: '设置饮食目标与营养需求', modal: 'goal' },
      { icon: '⚠️', name: '弱点防御', desc: '管理过敏源，自动规避风险', modal: 'allergy' },
      { icon: '📐', name: '体质鉴定', desc: '身高体重BMI数据', modal: 'body' },
      { icon: '🔔', name: '任务提醒', desc: '用餐时间提醒设置', modal: 'remind' },
      { icon: '❓', name: '冒险指南', desc: '帮助与反馈', modal: '' }
    ],

    // 模态框
    currentModal: '',

    // 属性/状态详情弹窗
    detailInfo: { icon: '', title: '', content: '' },

    // 菜品详情
    foodDetail: { name: '', emoji: '', rarityText: '', detail: '', protein: '', carb: '', fat: '' },

    // 目标
    goalType: 'bulk',
    goalCal: 2200,
    goalPro: 75,
    goalCarb: 280,
    goalFat: 65,
    goalFib: 25,

    // 过敏
    allergyList: [
      { icon: '🥜', name: '花生', selected: false },
      { icon: '🥛', name: '牛奶', selected: false },
      { icon: '🥚', name: '鸡蛋', selected: false },
      { icon: '🦐', name: '海鲜', selected: false },
      { icon: '🫘', name: '大豆', selected: false },
      { icon: '🌾', name: '麸质', selected: false },
      { icon: '🌰', name: '坚果', selected: false },
      { icon: '🦀', name: '虾蟹', selected: false },
      { icon: '🥭', name: '芒果', selected: false }
    ],

    // 体质
    bodyHeight: 175,
    bodyWeight: 60,
    bmiStatus: '正常',
    bmiColor: '#69f0ae',
    bmiPct: 23,

    // 提醒
    reminders: { breakfast: true, lunch: true, dinner: true },

    // Toast
    toastMsg: '',
    showToast: false
  },

  // 内部变量
  _particleCanvas: null,
  _mapCanvas: null,
  _coinRaw: 0,
  _themeApplied: '',
  _sysInfo: null,

  onLoad() {
    // 从主程序获取学生信息和营养数据
    const studentInfo = wx.getStorageSync('studentInfo') || {}
    const nutrition = wx.getStorageSync('todayNutrition') || {}

    // 获取系统信息，用于响应式计算
    this._sysInfo = wx.getSystemInfoSync()

    // 计算导航栏高度
    const statusBarHeight = this._sysInfo.statusBarHeight || 20
    // 导航栏内容区高度 48px（加大触摸友好）
    const navBarHeight = statusBarHeight + 48

    this.setData({
      statusBarHeight,
      navBarHeight,
      // 从主程序同步用户信息
      profileName: studentInfo.name || '冒险者',
      profileCollege: studentInfo.college || '',
      profileId: studentInfo.id || '',
      level: studentInfo.level || 5,
      // 从主程序同步营养数据到游戏属性
      'stats[0].current': nutrition.calories || 1680,
      'stats[0].max': nutrition.caloriesTarget || 2200,
      'stats[1].current': nutrition.protein || 68,
      'stats[1].max': nutrition.proteinTarget || 75,
      'stats[2].current': nutrition.carbs || 210,
      'stats[2].max': nutrition.carbsTarget || 280,
      'stats[3].current': nutrition.fiber || 18,
      'stats[3].max': nutrition.fiberTarget || 25
    })

    // 恢复保存的主题
    const savedTheme = wx.getStorageSync('hx-game-theme') || 'cyber'
    this.setData({ currentTheme: savedTheme })
    this._applyTheme(savedTheme)

    // 恢复宝箱状态（跨会话持久化）
    const today = new Date();
    const todayKey = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const lastClaim = wx.getStorageSync('hx-chest-date') || '';
    if (lastClaim === todayKey) {
      this.setData({
        chestOpened: true,
        chestLabel: '🎉 获得 50 💰！明日再来'
      });
    }

    // 加载今日装备列表
    this._loadTodayEquip()

    // 初始化地图节点（使用 rpx 定位）
    this._initMapNodes()
  },

  onReady() {
    // 初始化画布
    this._initParticles()
    this._initMap()
    setTimeout(() => this._initTrendChart(), 300)
  },

  // ===== 主题 =====
  _buildThemeStyle(themeKey) {
    // 将主题的所有 CSS 变量打包为 inline style 字符串
    // 这样切换主题时直接更新 .app 元素的 style，无需依赖属性选择器
    const t = THEMES[themeKey]
    if (!t) return ''
    const v = t.vars
    let s = ''
    for (const key in v) {
      s += key + ':' + v[key] + ';'
    }
    return s
  },

  _applyTheme(theme) {
    if (this._themeApplied === theme) return
    this._themeApplied = theme
    const t = THEMES[theme]
    if (!t) return

    // 更新 CSS 变量 inline style
    this.setData({
      themeStyle: this._buildThemeStyle(theme)
    })

    // 更新导航栏颜色
    wx.setNavigationBarColor({
      frontColor: t.light ? '#000000' : '#ffffff',
      backgroundColor: t.vars['--bg1'],
      animation: { duration: 300, timingFunc: 'easeIn' }
    })
  },

  toggleThemePanel() {
    this.setData({ showThemePanel: !this.data.showThemePanel })
  },

  setTheme(e) {
    const t = e.currentTarget.dataset.t
    if (!THEMES[t]) return
    this.setData({ currentTheme: t, showThemePanel: false })
    wx.setStorageSync('hx-game-theme', t)
    this._themeApplied = '' // 强制刷新
    this._applyTheme(t)
    this._showToast('🎨 主题已切换：' + THEMES[t].name)

    // 重绘地图（主题色变更）
    setTimeout(() => this._initMap(), 100)
    // 重新初始化粒子（浅色↔深色切换需要启停粒子）
    setTimeout(() => this._initParticles(), 100)
  },

  // ===== Tab切换 =====
  switchTab(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ currentTab: idx })
    if (idx === 0) {
      setTimeout(() => {
        this._initMapNodes()
        this._initMap()
      }, 100)
    }
    if (idx === 1) {
      setTimeout(() => this._initTrendChart(), 200)
    }
  },

  // ===== 返回主程序 =====
  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  // ===== 任务勾选 =====
  toggleQuest(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const quests = this.data.quests
    const q = quests[idx]
    // 已完成任务不可取消勾选
    if (q.done) {
      this._showToast('该任务已完成，无法取消')
      return
    }
    // 首次完成时标记并奖励
    if (!q.rewarded) {
      q.done = true
      q.rewarded = true
      // 从 reward 字符串提取金币数量，如 "+30 💰 · +15 EXP" → 30
      const match = q.reward.match(/\+(\d+)\s*💰/)
      const gold = match ? parseInt(match[1], 10) : 10
      this._coinRaw += gold
      this._showToast('✅ 任务完成！获得 +' + gold + ' 💰')
      this.setData({
        quests: [...quests],
        coins: this._formatGold(this._coinRaw)
      })
    }
  },

  // 金币格式化（替代不稳定的 toLocaleString）
  _formatGold(n) {
    if (typeof n !== 'number' || isNaN(n)) return '0'
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  // ===== 宝箱 =====
  openChest() {
    // 每日只能领一次：用日期 key 持久化到 storage
    const today = new Date();
    const todayKey = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const lastClaim = wx.getStorageSync('hx-chest-date') || '';
    if (lastClaim === todayKey) {
      this._showToast('今日宝箱已开启，明天再来！');
      return;
    }
    this._coinRaw += 50
    wx.setStorageSync('hx-chest-date', todayKey);
    this.setData({
      chestOpened: true,
      coins: this._formatGold(this._coinRaw),
      chestLabel: '🎉 获得 50 💰！明日再来'
    })
    this._showToast('🎁 宝箱开启！获得 50 金币')
  },

  // ===== 今日装备列表 =====
  _loadTodayEquip() {
    const slots = this.data.equipSlots
    const buffMap = {
      '蛋白剑': '+15% 蛋白质效率',
      '纤维盾': '+20% 纤维吸收',
      '碳水戒': '+10% 碳水利用率',
      '能量环': '+5 能量上限'
    }
    const list = slots.filter(function(s) { return s.filled; }).map(function(s) {
      return { icon: s.icon, label: s.label, buff: buffMap[s.label] || '+10% 全属性' }
    })
    this.setData({ todayEquipList: list, todayEquipCount: list.length })
  },

  // ===== 地图节点 =====
  _initMapNodes() {
    // 真实星期对齐（周一=0 ~ 周日=6）
    const realDay = new Date().getDay(); // 0=周日, 1=周一 ... 6=周六
    const dayIndex = realDay === 0 ? 6 : realDay - 1; // 周一=0 ~ 周日=6

    // 登山攀登布局：Z形路径
    // 节点全部约束在山体多边形内部，左右交替
    const rawNodes = [
      { origX: 150, origY: 720, day: '周一', stars: 3, cleared: true,  current: false, isBoss: false },
      { origX: 500, origY: 635, day: '周二', stars: 2, cleared: true,  current: false, isBoss: false },
      { origX: 200, origY: 550, day: '周三', stars: 3, cleared: true,  current: false, isBoss: false },
      { origX: 410, origY: 465, day: '周四', stars: 0, cleared: false, current: false, isBoss: false },
      { origX: 285, origY: 380, day: '周五', stars: 0, cleared: false, current: false, isBoss: false },
      { origX: 345, origY: 295, day: '周六', stars: 0, cleared: false, current: false, isBoss: false },
      { origX: 335, origY: 210, day: '周日', stars: 0, cleared: false, current: false, isBoss: false },
      { origX: 375, origY: 120, day: '奖励', stars: 0, cleared: false, current: false, isBoss: true  }
    ]

    // 对齐真实星期：当天及之前已通关，当天 current，之后 locked
    for (let i = 0; i < 7; i++) {
      if (i < dayIndex) {
        rawNodes[i].cleared = true;
        rawNodes[i].current = false;
      } else if (i === dayIndex) {
        rawNodes[i].cleared = false;
        rawNodes[i].current = true;
      } else {
        rawNodes[i].cleared = false;
        rawNodes[i].current = false;
      }
    }

    const nodeSizeRpx = 104
    const halfNode = nodeSizeRpx / 2

    // 坐标已是 rpx，直接使用
    const mapNodes = rawNodes.map(n => {
      const xRpx = Math.round(n.origX - halfNode)
      const yRpx = Math.round(n.origY - halfNode)
      let cls = n.current ? 'current' : n.cleared ? 'cleared' : 'locked'
      let starsText = n.cleared ? '⭐'.repeat(n.stars) : (n.current ? '🏃' : '🔒')
      let dayLabel = n.isBoss ? '👑' : n.day
      return {
        ...n,
        styleLeft: xRpx + 'rpx',
        styleTop: yRpx + 'rpx',
        cls, starsText, dayLabel
      }
    })

    // 生成节点间连线
    const mapLines = []
    for (let i = 0; i < rawNodes.length - 1; i++) {
      const a = rawNodes[i], b = rawNodes[i + 1]
      const cx1 = a.origX, cy1 = a.origY
      const cx2 = b.origX, cy2 = b.origY
      const dx = cx2 - cx1, dy = cy2 - cy1
      const dist = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx) * 180 / Math.PI
      mapLines.push({
        left: Math.round(cx1) + 'rpx',
        top: Math.round(cy1) + 'rpx',
        width: Math.round(dist) + 'rpx',
        angle: angle.toFixed(2) + 'deg',
        cleared: a.cleared && b.cleared
      })
    }

    const current = rawNodes.find(n => n.current) || rawNodes[0]
    const playerLeft = Math.round(current.origX - 32) + 'rpx'
    const playerTop = Math.round(current.origY - 128) + 'rpx'

    this.setData({ mapNodes, mapLines, playerLeft, playerTop })
  },

  onMapNodeTap(e) {
    const idx = Number(e.currentTarget.dataset.index)
    const node = this.data.mapNodes[idx]
    if (node.cleared) {
      this._showToast(node.day + '已通关！⭐×' + node.stars)
    } else if (node.current) {
      this._showToast(node.day + '正在进行中...')
    }
  },

  // ===== 菜品详情 =====
  showFoodDetail(e) {
    const food = e.currentTarget.dataset.food
    this.setData({
      currentModal: 'food',
      foodDetail: food
    })
  },

  addFood() {
    this.setData({ currentModal: '' })
    this._showToast('⚔️ 补给已装备！')
    // 刷新今日装备列表
    this._loadTodayEquip()
  },

  // ===== 模态框 =====
  showModal(e) {
    const type = e.currentTarget.dataset.type
    if (!type) return
    this.setData({ currentModal: type, showThemePanel: false })
  },

  closeModal() {
    this.setData({ currentModal: '' })
  },

  closeModalBg(e) {
    if (e.target === e.currentTarget) {
      this.setData({ currentModal: '' })
    }
  },

  // ===== 属性/状态详情弹窗 =====
  onAttrTap(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.attrs[idx]
    this.setData({
      currentModal: 'detail',
      detailInfo: { icon: item.icon, title: item.name, content: item.detail }
    })
  },

  onBuffTap(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.buffs[idx]
    this.setData({
      currentModal: 'detail',
      detailInfo: { icon: item.text.charAt(0) === '🛡' ? '🛡️' : item.text.charAt(0) === '⚡' ? '⚡' : item.text.charAt(0) === '⚠' ? '⚠️' : '🧊', title: item.text.replace(/^[🛡️⚡⚠️🧊]\s*/, ''), content: item.detail }
    })
  },

  // ===== 表单交互 =====
  onInputName(e) { this.setData({ profileName: e.detail.value }) },
  onInputId(e) { this.setData({ profileId: e.detail.value }) },
  onInputCollege(e) { this.setData({ profileCollege: e.detail.value }) },
  onInputAge(e) { this.setData({ profileAge: e.detail.value }) },

  setGender(e) {
    this.setData({ profileGender: e.currentTarget.dataset.val })
  },

  setGoal(e) {
    const type = e.currentTarget.dataset.type
    const goals = {
      cut: { cal: 1800, pro: 90, carb: 200, fat: 50, fib: 25 },
      healthy: { cal: 2200, pro: 75, carb: 280, fat: 65, fib: 25 },
      bulk: { cal: 2500, pro: 95, carb: 320, fat: 70, fib: 25 },
      muscle: { cal: 2800, pro: 120, carb: 350, fat: 80, fib: 25 }
    }
    const g = goals[type]
    this.setData({
      goalType: type,
      goalCal: g.cal,
      goalPro: g.pro,
      goalCarb: g.carb,
      goalFat: g.fat,
      goalFib: g.fib
    })
  },

  onInputGoalCal(e) { this.setData({ goalCal: Number(e.detail.value) }) },
  onInputGoalPro(e) { this.setData({ goalPro: Number(e.detail.value) }) },
  onInputGoalCarb(e) { this.setData({ goalCarb: Number(e.detail.value) }) },
  onInputGoalFat(e) { this.setData({ goalFat: Number(e.detail.value) }) },
  onInputGoalFib(e) { this.setData({ goalFib: Number(e.detail.value) }) },

  toggleAllergy(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const list = this.data.allergyList
    list[idx].selected = !list[idx].selected
    this.setData({ allergyList: list })
  },

  onInputHeight(e) {
    this.setData({ bodyHeight: Number(e.detail.value) }, () => this._calcBMI())
  },

  onInputWeight(e) {
    this.setData({ bodyWeight: Number(e.detail.value) }, () => this._calcBMI())
  },

  _calcBMI() {
    const h = this.data.bodyHeight
    const w = this.data.bodyWeight
    if (h <= 0 || w <= 0) return
    const bmi = (w / ((h / 100) * (h / 100))).toFixed(1)
    const bv = parseFloat(bmi)
    let status = '正常', color = '#69f0ae'
    if (bv < 18.5) { status = '偏瘦'; color = '#448aff' }
    else if (bv >= 24) { status = '偏胖'; color = '#ffd740' }
    else if (bv >= 28) { status = '肥胖'; color = '#ff5252' }
    const pct = bv < 15 ? 0 : bv > 35 ? 100 : ((bv - 15) / 20 * 100)
    this.setData({ bmiVal: bmi, bmiStatus: status, bmiColor: color, bmiPct: pct })
  },

  toggleReminder(e) {
    const key = e.currentTarget.dataset.key
    const reminders = this.data.reminders
    reminders[key] = !reminders[key]
    this.setData({ reminders })
  },

  // ===== 保存操作 =====
  saveProfile() {
    this.setData({ currentModal: '' })
    this._showToast('角色信息已保存')
  },
  saveGoal() {
    this.setData({ currentModal: '' })
    this._showToast('战斗目标已更新')
  },
  saveAllergy() {
    this.setData({ currentModal: '' })
    this._showToast('弱点防御已更新')
  },
  saveBody() {
    this.setData({ currentModal: '' })
    this._showToast('体质数据已保存')
  },
  saveReminders() {
    this.setData({ currentModal: '' })
    this._showToast('提醒设置已保存')
  },

  // ===== Toast =====
  _showToast(msg) {
    this.setData({ toastMsg: msg, showToast: true })
    setTimeout(() => {
      this.setData({ showToast: false })
    }, 2000)
  },

  // ===== 辅助 =====
  _hexToRgb(hex) {
    hex = hex.replace('#', '')
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return r + ',' + g + ',' + b
  },

  // ===== 粒子背景 =====
  _initParticles() {
    // 浅色主题不渲染粒子，背景纯色
    const theme = THEMES[this.data.currentTheme]
    if (theme && theme.light) {
      // 清空粒子画布
      const query = wx.createSelectorQuery()
      query.select('#particles').fields({ node: true, size: true }).exec((res) => {
        if (!res[0] || !res[0].node) return
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = this._sysInfo.pixelRatio
        canvas.width = this._sysInfo.windowWidth * dpr
        canvas.height = this._sysInfo.windowHeight * dpr
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      })
      return
    }

    const sys = this._sysInfo
    const query = wx.createSelectorQuery()
    query.select('#particles').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = sys.pixelRatio
      const w = sys.windowWidth
      const h = sys.windowHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)

      const particleCount = Math.min(60, Math.round(w * h / 12000))
      const particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.5,
          dx: (Math.random() - 0.5) * 0.3,
          dy: (Math.random() - 0.5) * 0.3,
          baseA: Math.random() * 0.4 + 0.1
        })
      }

      this._particleCanvas = canvas

      const draw = () => {
        ctx.clearRect(0, 0, w, h)
        const theme = THEMES[this.data.currentTheme]
        const isLight = theme && theme.light
        const [pr, pg, pb] = theme ? theme.particleRGB : [0, 229, 255]
        particles.forEach(p => {
          p.x += p.dx
          p.y += p.dy
          if (p.x < 0) p.x = w
          if (p.x > w) p.x = 0
          if (p.y < 0) p.y = h
          if (p.y > h) p.y = 0
          const alpha = isLight ? p.baseA * 0.35 : p.baseA
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(' + pr + ',' + pg + ',' + pb + ',' + alpha + ')'
          ctx.fill()
        })
        canvas.requestAnimationFrame(draw)
      }
      draw()
    })
  },

  // ===== 冒险地图 =====
  _initMap() {
    const sys = this._sysInfo
    const query = wx.createSelectorQuery()
    query.select('#mapCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = sys.pixelRatio

      const mapW = res[0].width || (sys.windowWidth - 32)
      const mapH = res[0].height || mapW * 1.2
      canvas.width = mapW * dpr
      canvas.height = mapH * dpr
      ctx.scale(dpr, dpr)

      // 山体轮廓 + 雪顶 + 旗子
      const theme = THEMES[this.data.currentTheme]
      const isLight = theme && theme.light
      const [mr, mg, mb] = theme ? theme.particleRGB : [0, 229, 255]

      ctx.beginPath()
      ctx.moveTo(-10, mapH + 10)
      ctx.lineTo(mapW * 0.04, mapH * 0.9)
      ctx.lineTo(mapW * 0.18, mapH * 0.72)
      ctx.lineTo(mapW * 0.32, mapH * 0.5)
      ctx.lineTo(mapW * 0.4, mapH * 0.28)
      ctx.lineTo(mapW * 0.5, mapH * 0.06)     // 主峰
      ctx.lineTo(mapW * 0.56, mapH * 0.2)
      ctx.lineTo(mapW * 0.68, mapH * 0.4)
      ctx.lineTo(mapW * 0.82, mapH * 0.56)
      ctx.lineTo(mapW * 0.94, mapH * 0.7)
      ctx.lineTo(mapW + 10, mapH * 0.8)
      ctx.lineTo(mapW + 10, mapH + 10)
      ctx.closePath()

      const grad = ctx.createLinearGradient(0, 0, 0, mapH)
      const a1 = isLight ? 0.06 : 0.13
      const a2 = isLight ? 0.02 : 0.04
      grad.addColorStop(0, 'rgba(' + mr + ',' + mg + ',' + mb + ',' + a1 + ')')
      grad.addColorStop(0.5, 'rgba(' + mr + ',' + mg + ',' + mb + ',0.06)')
      grad.addColorStop(1, 'rgba(' + mr + ',' + mg + ',' + mb + ',' + a2 + ')')
      ctx.fillStyle = grad
      ctx.fill()

      if (!isLight) {
        ctx.beginPath()
        ctx.moveTo(mapW * 0.44, mapH * 0.13)
        ctx.lineTo(mapW * 0.5, mapH * 0.06)
        ctx.lineTo(mapW * 0.56, mapH * 0.13)
        ctx.closePath()
        const snowGrad = ctx.createLinearGradient(mapW * 0.5, mapH * 0.06, mapW * 0.5, mapH * 0.18)
        snowGrad.addColorStop(0, 'rgba(255,255,255,0.15)')
        snowGrad.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = snowGrad
        ctx.fill()
      }

      // 旗子
      const flagX = mapW * 0.5
      const flagBaseY = mapH * 0.05
      const flagPoleH = mapH * 0.065
      const flagTopY = flagBaseY - flagPoleH
      ctx.beginPath()
      ctx.moveTo(flagX, flagBaseY)
      ctx.lineTo(flagX, flagTopY)
      ctx.strokeStyle = isLight ? 'rgba(80,80,80,0.5)' : 'rgba(255,255,255,0.4)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(flagX, flagTopY)
      ctx.lineTo(flagX + mapW * 0.04, flagTopY + mapH * 0.02)
      ctx.lineTo(flagX, flagTopY + mapH * 0.04)
      ctx.closePath()
      ctx.fillStyle = isLight ? 'rgba(220,50,50,0.85)' : 'rgba(255,80,80,0.85)'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(flagX, flagTopY, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = isLight ? 'rgba(200,160,0,0.9)' : 'rgba(255,215,0,0.9)'
      ctx.fill()

      this._mapCanvas = canvas
    })
  },

  // ===== 营养趋势折线图 =====
  _initTrendChart() {
    const data = this.data.weekTrend
    if (!data || !data.length) return
    const query = wx.createSelectorQuery()
    query.select('#trendCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = this._sysInfo.pixelRatio
      const w = res[0].width || 700
      const h = res[0].height || 320
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.scale(dpr, dpr)

      const theme = THEMES[this.data.currentTheme]
      const isLight = theme && theme.light
      const textColor = isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.25)'
      const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'
      const pad = { top: 20, right: 16, bottom: 32, left: 40 }
      const pw = w - pad.left - pad.right
      const ph = h - pad.top - pad.bottom

      // 各指标最大值（紧贴数据范围，最大化线间距）
      const maxVals = { cal: 2150, pro: 85, carb: 270, fib: 28 }
      const lines = [
        { key: 'cal', color: isLight ? '#d32f2f' : '#ff5252', label: '热量' },
        { key: 'pro', color: isLight ? '#1565c0' : '#448aff', label: '蛋白质' },
        { key: 'carb', color: isLight ? '#2e7d32' : '#69f0ae', label: '碳水' },
        { key: 'fib', color: '#ab47bc', label: '纤维' }
      ]

      // 网格线
      ctx.strokeStyle = gridColor
      ctx.lineWidth = 0.5
      for (let i = 0; i <= 4; i++) {
        const y = pad.top + (ph / 4) * i
        ctx.beginPath()
        ctx.moveTo(pad.left, y)
        ctx.lineTo(w - pad.right, y)
        ctx.stroke()
      }

      // X 轴标签
      ctx.fillStyle = textColor
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      data.forEach((d, i) => {
        const x = pad.left + (pw / (data.length - 1)) * i
        ctx.fillText(d.day, x, h - 6)
      })

      // 折线
      lines.forEach(line => {
        ctx.beginPath()
        ctx.strokeStyle = line.color
        ctx.lineWidth = 2
        ctx.lineJoin = 'round'
        data.forEach((d, i) => {
          const val = d[line.key] || 0
          const x = pad.left + (pw / (data.length - 1)) * i
          const y = pad.top + ph - (val / maxVals[line.key]) * ph
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()

        // 数据点
        data.forEach((d, i) => {
          const val = d[line.key] || 0
          if (val === 0) return
          const x = pad.left + (pw / (data.length - 1)) * i
          const y = pad.top + ph - (val / maxVals[line.key]) * ph
          ctx.beginPath()
          ctx.arc(x, y, 3, 0, Math.PI * 2)
          ctx.fillStyle = line.color
          ctx.fill()
        })
      })
    })
  }
})
