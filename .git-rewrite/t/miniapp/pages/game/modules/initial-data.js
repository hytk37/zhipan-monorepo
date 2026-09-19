/**
 * 智慧膳系统-冒险 · 页面初始数据
 *
 * 全部以「函数返回字面量」的方式提供，保证每次创建页面都拿到全新的对象，
 * 不会因为多个页面实例共享同一份引用而互相污染。
 *
 * 需要动态计算的字段（进度条宽度、BMI 指针位置等）在这里就拼成完整 style 字符串，
 * 不把 % 留在 WXML 的属性里——`style="width:{{pct}}%"` 会被 WXML 的样式校验报
 * “semi-colon expected”，把 % 提前拼进字符串即可规避。
 */

const { THEME_DOTS } = require('../../../utils/game-theme.js')
const { DEFAULT_THEME } = require('./storage.js')

function buildInitialData() {
  return {
    // 主题
    currentTheme: DEFAULT_THEME,
    showThemePanel: false,
    darkThemeDots: THEME_DOTS.filter(function (d) { return d.section === 'dark' }),
    lightThemeDots: THEME_DOTS.filter(function (d) { return d.section === 'light' }),
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

    // 地图节点（rpx 定位）
    mapNodes: [],
    mapLines: [],
    playerLeft: '',
    playerTop: '',
    mapCanvasHeight: 0,

    // 状态面板
    stats: [
      { icon: '🔥', label: 'HP 热量', color: 'hp', current: 1680, max: 2200, unit: 'kcal', pct: 76, labelStyle: 'color:var(--hp)', barStyle: 'width:76%' },
      { icon: '🥩', label: 'MP 蛋白质', color: 'mp', current: 68, max: 75, unit: 'g', pct: 91, labelStyle: 'color:var(--mp)', barStyle: 'width:91%' },
      { icon: '🍞', label: 'EXP 碳水', color: 'exp', current: 210, max: 280, unit: 'g', pct: 75, labelStyle: 'color:var(--exp)', barStyle: 'width:75%' },
      { icon: '🥬', label: 'FIB 膳食纤维', color: 'fiber', current: 18, max: 25, unit: 'g', pct: 72, labelStyle: 'color:#ab47bc', barStyle: 'width:72%' }
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
    bmiPointerStyle: 'left:23%',

    // 提醒
    reminders: { breakfast: true, lunch: true, dinner: true },

    // Toast
    toastMsg: '',
    showToast: false
  }
}

module.exports = {
  buildInitialData: buildInitialData
}
