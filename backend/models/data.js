// ============================================
// 智慧膳系统 · Mock 数据模型 (内存)
// ============================================
// 下一阶段将迁移至 SQLite

// ─── 学生列表 ───────────────────────────────────
const students = [
  { id: 0, name: '张三', gender: '男', age: 20, cardNo: 'STU20210001' },
  { id: 1, name: '李梅', gender: '女', age: 19, cardNo: 'STU20210002' },
  { id: 2, name: '王博', gender: '男', age: 22, cardNo: 'STU20210003' },
  { id: 3, name: '陈雨', gender: '女', age: 21, cardNo: 'STU20210004' },
  { id: 4, name: '赵磊', gender: '男', age: 20, cardNo: 'STU20210005' },
  { id: 5, name: '刘芳', gender: '女', age: 19, cardNo: 'STU20210006' },
];

// ─── 完整营养数据 ─────────────────────────────────
const nutritionData = {
  0: {
    name: '张三（男，20岁）',
    cal: 2980, calPct: 132, protein: '62g', fat: '105g', fiber: '3g',
    calStatus: '超标 32%', proteinStatus: '缺口 13g', fatStatus: '超标 50%', fiberStatus: '缺口 22g',
    calClass: 'blue', proteinClass: 'orange', fatClass: 'red', fiberClass: 'amber',
    calBadge: 'badge-over', proteinBadge: 'badge-low', fatBadge: 'badge-over', fiberBadge: 'badge-low',
    bars: [132, 83, 150, 95, 12],
    weekCalories: [2980, 2850, 2760, 3100, 2920, 2680, 3050],
    meals: [
      { time: '07:35', meal: '早餐', items: '米饭、猪肉包、豆浆', cal: 480 },
      { time: '12:10', meal: '午餐', items: '米饭、红烧肉、可乐鸡翅、炒白菜', cal: 1280 },
      { time: '18:20', meal: '晚餐', items: '米饭、回锅肉、炸鸡腿', cal: 1220 },
    ],
    aiWarning: '重度预警：连续3日脂肪摄入超标，膳食纤维严重不足！建议立即减少油炸食品，增加蔬菜摄入。',
    recommendations: [
      { rank: 1, name: '清蒸鲈鱼', score: 92, tags: ['高蛋白', '低脂', '推荐'], desc: '优质蛋白来源，脂肪含量极低。' },
      { rank: 2, name: '清炒西兰花', score: 88, tags: ['高纤维', '低脂'], desc: '膳食纤维含量极高。' },
      { rank: 3, name: '番茄炒蛋', score: 80, tags: ['营养均衡', '家常'], desc: '口感接受度高，营养均衡。' },
    ]
  },
  1: {
    name: '李梅（女，19岁）',
    cal: 1750, calPct: 97, protein: '55g', fat: '48g', fiber: '18g',
    calStatus: '接近达标', proteinStatus: '接近达标', fatStatus: '达标', fiberStatus: '缺口 7g',
    calClass: 'green', proteinClass: 'green', fatClass: 'green', fiberClass: 'orange',
    calBadge: 'badge-ok', proteinBadge: 'badge-ok', fatBadge: 'badge-ok', fiberBadge: 'badge-low',
    bars: [97, 92, 87, 88, 72],
    weekCalories: [1750, 1680, 1820, 1710, 1690, 1880, 1720],
    meals: [
      { time: '07:50', meal: '早餐', items: '小米粥、鸡蛋、馒头', cal: 380 },
      { time: '12:05', meal: '午餐', items: '米饭、番茄炒蛋、炒时蔬', cal: 780 },
      { time: '18:10', meal: '晚餐', items: '米饭、清蒸鲈鱼、凉拌黄瓜', cal: 590 },
    ],
    aiWarning: '轻度提醒：整体饮食较均衡，膳食纤维略有不足，建议增加粗粮和绿叶蔬菜。',
    recommendations: [
      { rank: 1, name: '凉拌黑木耳', score: 90, tags: ['高纤维', '低卡'], desc: '膳食纤维极高。' },
      { rank: 2, name: '燕麦粥', score: 85, tags: ['高纤维', '慢碳'], desc: '优质碳水来源。' },
      { rank: 3, name: '蒜蓉菠菜', score: 82, tags: ['高铁', '高纤维'], desc: '补铁同时补充纤维。' },
    ]
  },
  2: {
    name: '王博（男，22岁）',
    cal: 3200, calPct: 142, protein: '80g', fat: '120g', fiber: '5g',
    calStatus: '超标 42%', proteinStatus: '达标', fatStatus: '超标 71%', fiberStatus: '缺口 20g',
    calClass: 'red', proteinClass: 'green', fatClass: 'red', fiberClass: 'amber',
    calBadge: 'badge-over', proteinBadge: 'badge-ok', fatBadge: 'badge-over', fiberBadge: 'badge-low',
    bars: [142, 107, 171, 102, 20],
    weekCalories: [3200, 3100, 3300, 3050, 3150, 3400, 3250],
    meals: [
      { time: '07:30', meal: '早餐', items: '米饭、油条、豆浆、煎蛋', cal: 680 },
      { time: '12:00', meal: '午餐', items: '米饭、糖醋排骨、炸鸡腿、可乐', cal: 1560 },
      { time: '18:30', meal: '晚餐', items: '米饭、回锅肉、麻辣香锅、啤酒', cal: 1960 },
    ],
    aiWarning: '严重预警：热量、脂肪严重超标！饮食结构极不合理，长期将引发肥胖、高血压等健康风险！',
    recommendations: [
      { rank: 1, name: '水煮鱼片', score: 95, tags: ['高蛋白', '低脂'], desc: '高蛋白低脂肪。' },
      { rank: 2, name: '凉拌黄瓜', score: 88, tags: ['低卡', '高纤维'], desc: '极低热量，高水分。' },
      { rank: 3, name: '蒸蛋羹', score: 82, tags: ['高蛋白', '低脂'], desc: '优质蛋白，口感柔滑。' },
    ]
  },
  3: {
    name: '陈雨（女，21岁）',
    cal: 1600, calPct: 89, protein: '42g', fat: '52g', fiber: '22g',
    calStatus: '略低', proteinStatus: '缺口 18g', fatStatus: '达标', fiberStatus: '基本达标',
    calClass: 'amber', proteinClass: 'orange', fatClass: 'green', fiberClass: 'green',
    calBadge: 'badge-low', proteinBadge: 'badge-low', fatBadge: 'badge-ok', fiberBadge: 'badge-ok',
    bars: [89, 70, 95, 80, 88],
    weekCalories: [1600, 1550, 1650, 1580, 1620, 1700, 1590],
    meals: [
      { time: '08:00', meal: '早餐', items: '酸奶、全麦面包、苹果', cal: 320 },
      { time: '12:15', meal: '午餐', items: '米饭、清炒西兰花、番茄蛋汤', cal: 680 },
      { time: '18:00', meal: '晚餐', items: '米饭、蒜蓉菠菜、豆腐汤', cal: 600 },
    ],
    aiWarning: '中度提醒：蛋白质摄入不足，可能影响肌肉量和免疫力。建议增加豆制品、瘦肉、蛋类。',
    recommendations: [
      { rank: 1, name: '麻婆豆腐', score: 90, tags: ['高蛋白', '植物蛋白'], desc: '优质植物蛋白。' },
      { rank: 2, name: '水煮蛋', score: 87, tags: ['高蛋白', '便携'], desc: '最经济的蛋白质来源。' },
      { rank: 3, name: '小米粥+鸡蛋', score: 82, tags: ['高蛋白', '养胃'], desc: '早餐标配。' },
    ]
  },
  4: {
    name: '赵磊（男，20岁）',
    cal: 2480, calPct: 110, protein: '71g', fat: '82g', fiber: '8g',
    calStatus: '超标 10%', proteinStatus: '接近达标', fatStatus: '超标 17%', fiberStatus: '缺口 17g',
    calClass: 'orange', proteinClass: 'green', fatClass: 'orange', fiberClass: 'amber',
    calBadge: 'badge-over', proteinBadge: 'badge-ok', fatBadge: 'badge-over', fiberBadge: 'badge-low',
    bars: [110, 95, 117, 93, 32],
    weekCalories: [2480, 2350, 2520, 2410, 2380, 2550, 2460],
    meals: [
      { time: '07:40', meal: '早餐', items: '米饭、煎蛋、牛奶', cal: 520 },
      { time: '12:08', meal: '午餐', items: '米饭、土豆烧牛肉、炒豆芽', cal: 1050 },
      { time: '18:15', meal: '晚餐', items: '米饭、辣子鸡、凉拌黄瓜', cal: 910 },
    ],
    aiWarning: '中度提醒：脂肪摄入略高，膳食纤维不足。建议减少油炸菜品，增加蔬菜比例。',
    recommendations: [
      { rank: 1, name: '清炒时蔬', score: 89, tags: ['高纤维', '低卡'], desc: '混合蔬菜。' },
      { rank: 2, name: '蒸鸡胸肉', score: 86, tags: ['高蛋白', '低脂'], desc: '低脂高蛋白。' },
      { rank: 3, name: '紫菜蛋花汤', score: 81, tags: ['低卡', '补碘'], desc: '低热量汤品。' },
    ]
  },
  5: {
    name: '刘芳（女，19岁）',
    cal: 1920, calPct: 107, protein: '58g', fat: '62g', fiber: '21g',
    calStatus: '略超标', proteinStatus: '接近达标', fatStatus: '略超标', fiberStatus: '接近达标',
    calClass: 'orange', proteinClass: 'green', fatClass: 'orange', fiberClass: 'green',
    calBadge: 'badge-over', proteinBadge: 'badge-ok', fatBadge: 'badge-over', fiberBadge: 'badge-ok',
    bars: [107, 97, 113, 85, 84],
    weekCalories: [1920, 1880, 1950, 1910, 1890, 1980, 1930],
    meals: [
      { time: '07:45', meal: '早餐', items: '八宝粥、鸡蛋、小菜', cal: 420 },
      { time: '12:03', meal: '午餐', items: '米饭、红烧豆腐、炒空心菜、鸡汤', cal: 820 },
      { time: '18:08', meal: '晚餐', items: '米饭、炒土豆丝、蒸蛋羹', cal: 680 },
    ],
    aiWarning: '轻度提醒：整体较均衡，脂肪略高。建议晚餐减少用油，增加清蒸菜品。',
    recommendations: [
      { rank: 1, name: '清蒸鲈鱼', score: 91, tags: ['高蛋白', '低脂'], desc: '低脂高蛋白。' },
      { rank: 2, name: '白灼菜心', score: 86, tags: ['低卡', '高纤维'], desc: '极少油烹饪。' },
      { rank: 3, name: '银耳莲子汤', score: 83, tags: ['低卡', '美容'], desc: '低糖甜品。' },
    ]
  },
};

// ─── 后厨数据 ─────────────────────────────────────
const kitchenKPI = {
  mealCount: 4278,
  mealCountChange: '+3.2%',
  avgCal: 2340,
  avgCalRec: 2025,
  avgCalStatus: '超标 16%',
  fatOverRate: 68,
  fatOverChange: '+5%',
  fiberOkRate: 56,
  fiberAvg: 14,
  fiberRec: 25,
  fiberOkCount: 2240,
};

const groupRadar = {
  labels: ['热量', '蛋白质', '脂肪', '碳水', '膳食纤维'],
  actual: [116, 78, 122, 91, 56],
  standard: [100, 100, 100, 100, 100],
};

const heatmapData = {
  dishes: ['米饭', '红烧肉', '可乐鸡翅', '清蒸鲈鱼', '番茄炒蛋', '西兰花', '糖醋排骨'],
  days: ['一', '二', '三', '四', '五', '六', '日'],
  data: [
    [331, 354, 344, 371, 364, 405, 388],
    [354, 331, 378, 364, 388, 331, 344],
    [277, 294, 267, 287, 297, 310, 290],
    [128, 142, 132, 138, 135, 152, 142],
    [297, 310, 317, 307, 314, 300, 304],
    [142, 155, 162, 148, 169, 175, 165],
    [243, 263, 253, 260, 273, 250, 256],
  ]
};

const forecastData = [
  { dish: '米饭', qty: 1242, trend: 'up', change: '2.1%' },
  { dish: '红烧肉', qty: 378, trend: 'up', change: '4.8%' },
  { dish: '可乐鸡翅', qty: 294, trend: 'up', change: '1.2%' },
  { dish: '清蒸鲈鱼', qty: 142, trend: 'down', change: '0.8%' },
  { dish: '清炒西兰花', qty: 155, trend: 'up', change: '12.3%' },
  { dish: '番茄炒蛋', qty: 317, trend: 'up', change: '3.5%' },
  { dish: '糖醋排骨', qty: 263, trend: 'up', change: '1.6%' },
  { dish: '回锅肉', qty: 219, trend: 'down', change: '2.4%' },
];

const purchaseData = [
  { item: '西兰花', reason: '高纤维，补充全校膳食纤维缺口', amount: 49, unit: 'kg', change: 'up', changePct: '+60%' },
  { item: '菠菜', reason: '富含铁质与膳食纤维', amount: 35, unit: 'kg', change: 'up', changePct: '+45%' },
  { item: '芹菜', reason: '高纤维蔬菜，降血压辅助', amount: 29, unit: 'kg', change: 'up', changePct: '+30%' },
  { item: '鲈鱼', reason: '高蛋白低脂，优质蛋白来源', amount: 43, unit: 'kg', change: 'up', changePct: '+25%' },
  { item: '猪五花肉', reason: '高脂食材，适当控制采购量', amount: 66, unit: 'kg', change: 'down', changePct: '-20%' },
  { item: '鸡翅', reason: '高销量，维持库存', amount: 81, unit: 'kg', change: 'same', changePct: '持平' },
  { item: '大米', reason: '主食刚需，按预测量采购', amount: 277, unit: 'kg', change: 'up', changePct: '2.1%' },
];

const newDishData = [
  { name: '爆炒猪肝', problem: '补铁需求', acceptance: '高', cost: '低', reason: '针对全校缺铁问题。' },
  { name: '凉拌木耳', problem: '膳食纤维不足', acceptance: '中', cost: '低', reason: '高纤维，低热量。' },
  { name: '清蒸鳕鱼', problem: '优质蛋白不足', acceptance: '高', cost: '中', reason: '高端蛋白来源。' },
  { name: '燕麦粥', problem: '早餐碳水质量低', acceptance: '高', cost: '低', reason: '慢吸收碳水。' },
];

const fiberDist = {
  labels: ['严重不足 (<10g) · 1,120人', '摄入不足 (10-20g) · 1,760人', '基本达标 (>20g) · 1,120人'],
  data: [28, 44, 28],
  counts: [1120, 1760, 1120],
};

const monthlyTrend = {
  days: Array.from({ length: 30 }, (_, i) => `${i + 1}日`),
  calData: Array.from({ length: 30 }, () => Math.round(2200 + Math.random() * 400)),
  fiberData: Array.from({ length: 30 }, () => Math.round(1200 + Math.random() * 600)),
};

const systemStatus = {
  studentCount: 4000,
  mealCount: 4278,
  dishCount: 127,
  dishCategories: 23,
  accuracy: 91.4,
  recordCount: 130229,
  nutritionCoverage: 98.7,
};

// ─── 小程序专用数据 ─────────────────────────────────
const studentProfiles = {
  0: { id: 2023010042, name: '张三', college: '计算机学院', avatar: '👨🏻', diet: '无限制', gender: '男', age: 20, height: 175, weight: 60, bmi: 19.6, goal: '健康增重', level: 3, checkDays: 23, avgScore: 82, allergyList: ['花生'] },
  1: { id: 2023010045, name: '李梅', college: '外国语学院', avatar: '👩🏾', diet: '清真', gender: '女', age: 19, height: 163, weight: 52, bmi: 19.5, goal: '均衡饮食', level: 5, checkDays: 42, avgScore: 88, allergyList: [] },
  2: { id: 2023010051, name: '王博', college: '体育学院', avatar: '👨🏼', diet: '无限制', gender: '男', age: 22, height: 183, weight: 78, bmi: 23.3, goal: '减脂塑形', level: 7, checkDays: 67, avgScore: 91, allergyList: ['海鲜'] },
  3: { id: 2023010063, name: '陈雨', college: '艺术学院', avatar: '👩🏽', diet: '蛋奶素', gender: '女', age: 21, height: 165, weight: 55, bmi: 20.2, goal: '均衡饮食', level: 4, checkDays: 31, avgScore: 85, allergyList: ['麸质'] },
  4: { id: 2023010078, name: '赵磊', college: '计算机学院', avatar: '👨🏽', diet: '无麸质', gender: '男', age: 20, height: 178, weight: 72, bmi: 22.7, goal: '增肌增重', level: 6, checkDays: 55, avgScore: 90, allergyList: ['牛奶', '鸡蛋'] },
  5: { id: 2023010092, name: '刘芳', college: '医学院', avatar: '🧑🏻', diet: '低敏', gender: '女', age: 19, height: 160, weight: 48, bmi: 18.8, goal: '健康增重', level: 2, checkDays: 12, avgScore: 76, allergyList: ['花生', '虾蟹', '芒果'] },
};

const todayNutritionStore = {
  0: { calories: 1680, caloriesTarget: 2200, protein: 68, proteinTarget: 75, carbs: 210, carbsTarget: 280, fat: 48, fatTarget: 65, fiber: 18, fiberTarget: 25, score: 82, checked: false, goalType: '健康增重' },
  1: { calories: 1750, caloriesTarget: 1800, protein: 55, proteinTarget: 60, carbs: 210, carbsTarget: 220, fat: 48, fatTarget: 55, fiber: 18, fiberTarget: 22, score: 88, checked: true, goalType: '均衡饮食' },
  2: { calories: 3200, caloriesTarget: 2800, protein: 80, proteinTarget: 120, carbs: 340, carbsTarget: 350, fat: 120, fatTarget: 80, fiber: 5, fiberTarget: 30, score: 65, checked: false, goalType: '增肌增重' },
  3: { calories: 1600, caloriesTarget: 2000, protein: 42, proteinTarget: 65, carbs: 190, carbsTarget: 240, fat: 52, fatTarget: 55, fiber: 22, fiberTarget: 25, score: 78, checked: false, goalType: '均衡饮食' },
  4: { calories: 2480, caloriesTarget: 2500, protein: 71, proteinTarget: 100, carbs: 260, carbsTarget: 280, fat: 82, fatTarget: 70, fiber: 8, fiberTarget: 25, score: 72, checked: true, goalType: '健康增重' },
  5: { calories: 1920, caloriesTarget: 2000, protein: 58, proteinTarget: 70, carbs: 220, carbsTarget: 250, fat: 62, fatTarget: 60, fiber: 21, fiberTarget: 25, score: 85, checked: false, goalType: '减脂塑形' },
};

const foodDB = {
  1: { id: 1, emoji: '🍗', name: '红烧鸡腿', cal: 320, protein: 28, fat: 18, carbs: 12, fiber: 0, tags: ['高蛋白', '低脂'], desc: '经典家常菜，鸡腿肉嫩滑入味' },
  2: { id: 2, emoji: '🥦', name: '蒜蓉西兰花', cal: 80, protein: 4, fat: 2, carbs: 10, fiber: 5, tags: ['高纤维', '低卡'], desc: '清爽素菜，富含维生素C和膳食纤维' },
  3: { id: 3, emoji: '🍚', name: '杂粮米饭', cal: 210, protein: 5, fat: 1, carbs: 45, fiber: 3, tags: ['低GI', '粗粮'], desc: '大米搭配糙米、小米、燕麦' },
  4: { id: 4, emoji: '🥩', name: '酱牛肉', cal: 380, protein: 35, fat: 22, carbs: 8, fiber: 0, tags: ['高蛋白', '补铁'], desc: '酱香浓郁，优质蛋白和铁质来源' },
  5: { id: 5, emoji: '🥬', name: '清炒菠菜', cal: 60, protein: 4, fat: 1, carbs: 8, fiber: 4, tags: ['低卡', '补铁'], desc: '简单快炒，富含铁质和多种维生素' },
  6: { id: 6, emoji: '🍜', name: '牛肉拉面', cal: 580, protein: 32, fat: 15, carbs: 78, fiber: 2, tags: ['人气王', '高蛋白'], desc: '拉面劲道，牛肉汤鲜味美' },
  7: { id: 7, emoji: '🥚', name: '蒸蛋羹', cal: 120, protein: 12, fat: 7, carbs: 2, fiber: 0, tags: ['易消化', '低卡'], desc: '嫩滑如布丁，适合消化不好的时候吃' },
  8: { id: 8, emoji: '🌽', name: '蒸玉米', cal: 180, protein: 6, fat: 2, carbs: 38, fiber: 4, tags: ['粗粮', '低GI'], desc: '香甜软糯，慢吸收碳水' },
};

const remindSettingsStore = {};

module.exports = {
  students,
  nutritionData,
  kitchenKPI,
  groupRadar,
  heatmapData,
  forecastData,
  purchaseData,
  newDishData,
  fiberDist,
  monthlyTrend,
  systemStatus,
  studentProfiles,
  todayNutritionStore,
  foodDB,
  remindSettingsStore,
};
