// ============================================
// 智慧膳系统 · Mock 数据模型 (内存)
// ============================================
// 菜品/菜单数据来源：学生食谱第13周（2026-05-25 ~ 2026-05-31，真实食堂食谱）
// 下一阶段将迁移至 MySQL（sql/schema.sql 已就绪）

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
      { time: '07:35', meal: '早餐', items: '玉米粥、莲白肉包、煎荷包蛋、学生纯牛奶', cal: 480 },
      { time: '12:10', meal: '午餐', items: '玉米饭、干锅排骨、碎肉豌豆、酱烧茄子', cal: 1280 },
      { time: '18:20', meal: '晚餐', items: '红豆饭、胡萝卜烧肘子、莲白肉片、青瓜三鲜汤', cal: 1220 },
    ],
    aiWarning: '重度预警：连续3日脂肪摄入超标，膳食纤维严重不足！建议立即减少油炸食品，增加蔬菜摄入。',
    recommendations: [
      { rank: 1, name: '豆花龙利鱼', score: 92, tags: ['高蛋白', '低脂', '推荐'], desc: '优质蛋白来源，脂肪含量极低。' },
      { rank: 2, name: '蒜蓉西兰花', score: 88, tags: ['高纤维', '低脂'], desc: '膳食纤维含量极高。' },
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
      { time: '07:50', meal: '早餐', items: '南瓜粥、营养蛋、奶香馒头、学生纯牛奶', cal: 380 },
      { time: '12:05', meal: '午餐', items: '燕麦饭、萝卜烧牛腩、山椒兔、蒜蓉菠菜', cal: 780 },
      { time: '18:10', meal: '晚餐', items: '小米饭、黑椒鸡丁、清炒绿豆芽、冬瓜肉片汤', cal: 590 },
    ],
    aiWarning: '轻度提醒：整体饮食较均衡，膳食纤维略有不足，建议增加粗粮和绿叶蔬菜。',
    recommendations: [
      { rank: 1, name: '萝卜烧牛腩', score: 90, tags: ['高蛋白', '补铁'], desc: '优质蛋白和铁质来源。' },
      { rank: 2, name: '山椒兔', score: 85, tags: ['高蛋白', '低脂'], desc: '高蛋白低脂肪的瘦肉来源。' },
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
      { time: '07:30', meal: '早餐', items: '黑米粥、酱肉包、油条、煎荷包蛋', cal: 680 },
      { time: '12:00', meal: '午餐', items: '红薯饭、糯米粉蒸排骨、糖醋里脊、黄金脆猪排', cal: 1560 },
      { time: '18:30', meal: '晚餐', items: '特色炒刀削面、香芋烧肘子、干煸肥肠、香辣鸡排', cal: 1960 },
    ],
    aiWarning: '严重预警：热量、脂肪严重超标！饮食结构极不合理，长期将引发肥胖、高血压等健康风险！',
    recommendations: [
      { rank: 1, name: '仔姜跳水兔', score: 95, tags: ['高蛋白', '低脂'], desc: '高蛋白低脂肪。' },
      { rank: 2, name: '魔芋烧鱼', score: 88, tags: ['低卡', '高蛋白'], desc: '低热量高蛋白，饱腹感强。' },
      { rank: 3, name: '醋溜大白菜', score: 82, tags: ['低卡', '高纤维'], desc: '极低热量，高水分。' },
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
      { time: '08:00', meal: '早餐', items: '红薯粥、营养蛋、学生纯牛奶', cal: 320 },
      { time: '12:15', meal: '午餐', items: '红薯饭、麻婆豆腐、清炒三月瓜丝、紫菜蛋花汤', cal: 680 },
      { time: '18:00', meal: '晚餐', items: '绿豆饭、金钩冬瓜、双椒玉米、绿豆汤', cal: 600 },
    ],
    aiWarning: '中度提醒：蛋白质摄入不足，可能影响肌肉量和免疫力。建议增加豆制品、瘦肉、蛋类。',
    recommendations: [
      { rank: 1, name: '麻婆豆腐', score: 90, tags: ['高蛋白', '植物蛋白'], desc: '优质植物蛋白。' },
      { rank: 2, name: '双椒玉米', score: 87, tags: ['粗粮', '低GI'], desc: '慢吸收碳水，膳食纤维足。' },
      { rank: 3, name: '蒜蓉油麦菜', score: 82, tags: ['高纤维', '低卡'], desc: '低卡绿叶菜，补充纤维。' },
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
      { time: '07:40', meal: '早餐', items: '玉米粥、蒸红薯、煮玉米棒', cal: 520 },
      { time: '12:08', meal: '午餐', items: '玉米掺饭、莲藕炖蹄花、卤鸡腿、干焙有机花菜', cal: 1050 },
      { time: '18:15', meal: '晚餐', items: '胡萝卜饭、魔芋烧鱼、蒜蓉西兰花、绿豆汤', cal: 910 },
    ],
    aiWarning: '中度提醒：脂肪摄入略高，膳食纤维不足。建议减少油炸菜品，增加蔬菜比例。',
    recommendations: [
      { rank: 1, name: '莲藕炖蹄花', score: 89, tags: ['高蛋白', '滋补'], desc: '胶原蛋白丰富，炖煮少油。' },
      { rank: 2, name: '卤鸡腿', score: 86, tags: ['高蛋白', '低卡'], desc: '去皮鸡腿肉，低脂高蛋白。' },
      { rank: 3, name: '拌卤素什锦', score: 81, tags: ['高纤维', '低卡'], desc: '多种蔬菜卤味，纤维充足。' },
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
      { time: '07:45', meal: '早餐', items: '蔬菜瘦肉粥、营养蛋、藕丁肉包', cal: 420 },
      { time: '12:03', meal: '午餐', items: '南瓜饭、土豆排骨、鱼香肉丝、西红柿蛋花汤', cal: 820 },
      { time: '18:08', meal: '晚餐', items: '红苕饭、绍子蒸水蛋、香菇菜心、酸菜粉丝汤', cal: 680 },
    ],
    aiWarning: '轻度提醒：整体较均衡，脂肪略高。建议晚餐减少用油，增加清蒸菜品。',
    recommendations: [
      { rank: 1, name: '番茄牛腩', score: 91, tags: ['高蛋白', '低脂'], desc: '低脂高蛋白，番茄助吸收。' },
      { rank: 2, name: '蒜蓉生菜', score: 86, tags: ['低卡', '高纤维'], desc: '极少油烹饪，纤维充足。' },
      { rank: 3, name: '银耳汤', score: 83, tags: ['低卡', '滋阴'], desc: '低糖甜品，润燥。' },
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
  dishes: ['玉米饭', '土豆排骨', '鱼香肉丝', '番茄炒蛋', '红烧狮子头', '豆花龙利鱼', '蒜蓉西兰花'],
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
  { dish: '玉米饭', qty: 1242, trend: 'up', change: '2.1%' },
  { dish: '土豆排骨', qty: 378, trend: 'up', change: '4.8%' },
  { dish: '红烧狮子头', qty: 294, trend: 'up', change: '1.2%' },
  { dish: '豆花龙利鱼', qty: 142, trend: 'down', change: '0.8%' },
  { dish: '蒜蓉西兰花', qty: 155, trend: 'up', change: '12.3%' },
  { dish: '番茄炒蛋', qty: 317, trend: 'up', change: '3.5%' },
  { dish: '糖醋里脊', qty: 263, trend: 'up', change: '1.6%' },
  { dish: '干锅排骨', qty: 219, trend: 'down', change: '2.4%' },
];

const purchaseData = [
  { item: '大米', reason: '主食刚需（玉米饭/红薯饭/红豆饭等），按预测量采购', amount: 277, unit: 'kg', change: 'up', changePct: '2.1%' },
  { item: '鲜鸡蛋', reason: '营养蛋/蒸蛋/炒蛋，早餐刚需每日供应', amount: 130, unit: 'kg', change: 'up', changePct: '+2.1%' },
  { item: '猪排骨', reason: '干锅排骨、土豆排骨等人气菜主料', amount: 88, unit: 'kg', change: 'up', changePct: '+45%' },
  { item: '鸡腿', reason: '脆皮鸡腿、卤鸡腿、香辣鸡排，高销量维持库存', amount: 81, unit: 'kg', change: 'same', changePct: '持平' },
  { item: '学生纯牛奶', reason: '早餐每日固定供应，按在校人数备货', amount: 96, unit: 'kg', change: 'same', changePct: '持平' },
  { item: '西兰花', reason: '高纤维，补充全校膳食纤维缺口', amount: 49, unit: 'kg', change: 'up', changePct: '+60%' },
  { item: '牛腩', reason: '番茄牛腩、萝卜烧牛腩，优质蛋白来源', amount: 43, unit: 'kg', change: 'up', changePct: '+25%' },
];

const newDishData = [
  { name: '清蒸鲈鱼', problem: '优质蛋白不足', acceptance: '高', cost: '中', reason: '本周谱鱼类只有龙利鱼和乌鱼，建议增加清蒸类低脂鱼。' },
  { name: '凉拌木耳', problem: '膳食纤维不足', acceptance: '中', cost: '低', reason: '高纤维，低热量，与现有热炒素菜互补。' },
  { name: '杂粮馒头', problem: '早餐粗粮比例低', acceptance: '高', cost: '低', reason: '本周早餐馒头以精制面粉为主，增加杂粮比例。' },
  { name: '番茄豆腐汤', problem: '晚餐汤品偏荤', acceptance: '高', cost: '低', reason: '为蛋奶素同学提供更多素汤选择。' },
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
  dishCount: 217,
  dishCategories: 9,
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

// ─── 菜品库（营养数值为按《中国食物成分表》口径的单份估算）──
// cat: 荤菜/素菜/主食/汤品/面食/粥品/小吃/饮品/包点
const foodDB = {
  // 一、小程序精选位菜品 (id 1-22)
  1: { id: 1, emoji: '🍖', name: '干锅排骨', cat: '荤菜', cal: 420, protein: 24, fat: 28, carbs: 18, fiber: 2, tags: ['高蛋白', '人气王'], desc: '周一午餐套餐招牌，排骨干香入味' },
  2: { id: 2, emoji: '🥦', name: '蒜蓉西兰花', cat: '素菜', cal: 85, protein: 4, fat: 4, carbs: 8, fiber: 4.5, tags: ['高纤维', '低卡'], desc: '清爽素菜，维生素C和膳食纤维丰富' },
  3: { id: 3, emoji: '🍚', name: '玉米饭', cat: '主食', cal: 260, protein: 7, fat: 2, carbs: 54, fiber: 4, tags: ['粗粮', '低GI'], desc: '大米掺玉米碴，周一午餐主食' },
  4: { id: 4, emoji: '🥘', name: '碎肉豌豆', cat: '荤菜', cal: 260, protein: 14, fat: 12, carbs: 24, fiber: 4, tags: ['高蛋白'], desc: '肉末烧豌豆，下饭家常味' },
  5: { id: 5, emoji: '🍲', name: '银耳汤', cat: '汤品', cal: 60, protein: 1, fat: 0.5, carbs: 14, fiber: 2, tags: ['低卡', '滋阴'], desc: '周一午餐汤品，润燥低卡' },
  6: { id: 6, emoji: '🦑', name: '豆腐烧三鲜', cat: '荤菜', cal: 280, protein: 16, fat: 16, carbs: 18, fiber: 3, tags: ['高蛋白'], desc: '豆腐配鱿鱼、鱼豆腐等三鲜料（周一特色）' },
  7: { id: 7, emoji: '🦆', name: '甜皮鸭', cat: '荤菜', cal: 390, protein: 26, fat: 24, carbs: 14, fiber: 1, tags: ['人气王'], desc: '川味甜皮鸭，皮酥肉嫩' },
  8: { id: 8, emoji: '🍗', name: '脆皮鸡腿', cat: '荤菜', cal: 360, protein: 28, fat: 20, carbs: 12, fiber: 1, tags: ['高蛋白'], desc: '外皮酥脆，鸡腿肉嫩滑' },
  9: { id: 9, emoji: '🍗', name: '卤鸡腿', cat: '荤菜', cal: 310, protein: 26, fat: 18, carbs: 6, fiber: 0, tags: ['高蛋白', '低卡'], desc: '卤香入味，去皮食用更低脂' },
  10: { id: 10, emoji: '🍜', name: '素椒杂酱面', cat: '面食', cal: 520, protein: 18, fat: 16, carbs: 72, fiber: 3, tags: ['人气王'], desc: '周一午餐面食，干拌杂酱川味十足' },
  11: { id: 11, emoji: '🍖', name: '胡萝卜烧肘子', cat: '荤菜', cal: 460, protein: 28, fat: 32, carbs: 16, fiber: 1, tags: ['高蛋白'], desc: '周一晚餐套餐硬菜，软糯脱骨' },
  12: { id: 12, emoji: '🥬', name: '莲白肉片', cat: '荤菜', cal: 220, protein: 14, fat: 14, carbs: 8, fiber: 2, tags: ['高蛋白'], desc: '莲白（圆白菜）炒肉片，家常味' },
  13: { id: 13, emoji: '🍤', name: '虾仁绍子蒸蛋', cat: '荤菜', cal: 180, protein: 15, fat: 11, carbs: 5, fiber: 0, tags: ['高蛋白', '易消化'], desc: '虾仁肉末蒸蛋，嫩滑易吸收（含蛋、虾）' },
  14: { id: 14, emoji: '🍛', name: '台式卤肉盖浇饭', cat: '主食', cal: 680, protein: 22, fat: 26, carbs: 88, fiber: 3, tags: ['人气王'], desc: '周一晚餐盖浇饭，卤肉汁浓饭香' },
  15: { id: 15, emoji: '🌽', name: '双椒玉米', cat: '素菜', cal: 130, protein: 4, fat: 5, carbs: 19, fiber: 3, tags: ['粗粮', '低GI'], desc: '青红椒炒玉米粒，晚餐素菜' },
  16: { id: 16, emoji: '🌶️', name: '水煮肉片', cat: '荤菜', cal: 380, protein: 26, fat: 26, carbs: 10, fiber: 1, tags: ['高蛋白'], desc: '麻辣鲜香的川味经典' },
  17: { id: 17, emoji: '🥩', name: '番茄牛腩', cat: '荤菜', cal: 340, protein: 26, fat: 18, carbs: 14, fiber: 2, tags: ['高蛋白', '补铁'], desc: '番茄炖牛腩，酸甜开胃补铁' },
  18: { id: 18, emoji: '🍅', name: '番茄炒蛋', cat: '素菜', cal: 190, protein: 9, fat: 13, carbs: 9, fiber: 1, tags: ['营养均衡', '家常'], desc: '国民家常菜，周三晚餐套餐（含蛋）' },
  19: { id: 19, emoji: '🐟', name: '豆花龙利鱼', cat: '荤菜', cal: 240, protein: 24, fat: 12, carbs: 10, fiber: 0, tags: ['高蛋白', '低脂'], desc: '龙利鱼嫩滑无刺，配嫩豆花（周二特色）' },
  20: { id: 20, emoji: '🐰', name: '山椒兔', cat: '荤菜', cal: 260, protein: 26, fat: 13, carbs: 6, fiber: 0, tags: ['高蛋白', '低脂'], desc: '鲜辣山椒味，兔肉高蛋白低脂肪' },
  21: { id: 21, emoji: '🥩', name: '萝卜烧牛腩', cat: '荤菜', cal: 350, protein: 24, fat: 20, carbs: 16, fiber: 2, tags: ['高蛋白', '补铁'], desc: '白萝卜烧牛腩，清炖少油' },
  22: { id: 22, emoji: '🍲', name: '冬瓜肉片汤', cat: '汤品', cal: 95, protein: 8, fat: 5, carbs: 4, fiber: 1, tags: ['低卡'], desc: '周二晚餐汤品，清热解腻' },

  // 二、本周菜品库（第13周食谱，按类别）
  // —— 午/晚餐 · 荤菜
  23: { id: 23, emoji: '🍖', name: '红烧狮子头', cat: '荤菜', cal: 380, protein: 20, fat: 28, carbs: 12, fiber: 1, tags: ['高蛋白'], desc: '手工大肉丸，红烧入味' },
  24: { id: 24, emoji: '🦆', name: '外婆菜炒鸡粒', cat: '荤菜', cal: 250, protein: 18, fat: 14, carbs: 10, fiber: 2, tags: ['高蛋白'], desc: '外婆菜咸香配鸡米粒' },
  25: { id: 25, emoji: '🌶️', name: '青椒萝卜干回锅肉', cat: '荤菜', cal: 320, protein: 15, fat: 22, carbs: 14, fiber: 2, tags: ['人气王'], desc: '萝卜干回锅肉，下饭一绝' },
  26: { id: 26, emoji: '🍗', name: '钵钵鸡', cat: '荤菜', cal: 300, protein: 22, fat: 18, carbs: 10, fiber: 1, tags: ['人气王'], desc: '藤椒红油冷串，川味经典' },
  27: { id: 27, emoji: '🍛', name: '茄汁藕盒', cat: '荤菜', cal: 290, protein: 10, fat: 16, carbs: 26, fiber: 2, tags: [], desc: '藕夹肉炸制，茄汁调味' },
  28: { id: 28, emoji: '🍗', name: '狼牙土豆鸡', cat: '荤菜', cal: 280, protein: 14, fat: 12, carbs: 28, fiber: 2, tags: [], desc: '狼牙土豆配鸡块，周二午餐套餐' },
  29: { id: 29, emoji: '🥘', name: '莲藕炒肉片', cat: '荤菜', cal: 260, protein: 13, fat: 14, carbs: 20, fiber: 2, tags: [], desc: '脆藕配肉片，清爽家常' },
  30: { id: 30, emoji: '🍲', name: '麻婆豆腐', cat: '素菜', cal: 240, protein: 13, fat: 16, carbs: 10, fiber: 2, tags: ['高蛋白'], desc: '麻辣鲜香烫，植物蛋白丰富' },
  31: { id: 31, emoji: '🐰', name: '仔姜跳水兔', cat: '荤菜', cal: 250, protein: 26, fat: 12, carbs: 6, fiber: 0, tags: ['高蛋白', '低脂'], desc: '仔姜鲜辣，兔肉细嫩低脂' },
  32: { id: 32, emoji: '🍖', name: '糯米粉蒸排骨', cat: '荤菜', cal: 450, protein: 24, fat: 26, carbs: 28, fiber: 1, tags: ['人气王'], desc: '糯米蒸排骨，软糯咸香' },
  33: { id: 33, emoji: '🥘', name: '番茄烩三鲜', cat: '荤菜', cal: 220, protein: 12, fat: 10, carbs: 18, fiber: 2, tags: ['营养均衡'], desc: '番茄烩制，三鲜料足' },
  34: { id: 34, emoji: '🍖', name: '孜然卤肉', cat: '荤菜', cal: 380, protein: 20, fat: 28, carbs: 10, fiber: 1, tags: [], desc: '孜然香料卤制，风味浓郁' },
  35: { id: 35, emoji: '🦆', name: '功夫鸭腿', cat: '荤菜', cal: 380, protein: 26, fat: 24, carbs: 12, fiber: 1, tags: ['高蛋白'], desc: '秘制卤鸭腿，肉厚入味' },
  36: { id: 36, emoji: '🍖', name: '黄豆花生烧猪脚', cat: '荤菜', cal: 480, protein: 26, fat: 34, carbs: 16, fiber: 2, tags: ['高蛋白'], desc: '胶原丰富，黄豆花生同烧' },
  37: { id: 37, emoji: '🥘', name: '三月瓜炒肉丝', cat: '荤菜', cal: 200, protein: 12, fat: 12, carbs: 10, fiber: 1, tags: [], desc: '嫩南瓜丝炒肉丝，清爽家常' },
  38: { id: 38, emoji: '🥬', name: '苦瓜肉片', cat: '荤菜', cal: 160, protein: 11, fat: 9, carbs: 8, fiber: 2, tags: ['低卡'], desc: '苦瓜清热，肉片提香' },
  39: { id: 39, emoji: '🍗', name: '黑椒鸡丁', cat: '荤菜', cal: 280, protein: 26, fat: 14, carbs: 10, fiber: 1, tags: ['高蛋白'], desc: '黑椒风味鸡丁，周二晚餐特色' },
  40: { id: 40, emoji: '🥩', name: '萝卜烧牛腩（晚餐）', cat: '荤菜', cal: 350, protein: 24, fat: 20, carbs: 16, fiber: 2, tags: [], desc: '同21号，晚餐档口出餐' },
  41: { id: 41, emoji: '🌶️', name: '干煸肥肠', cat: '荤菜', cal: 420, protein: 16, fat: 34, carbs: 12, fiber: 1, tags: ['人气王'], desc: '干煸香辣，处理干净无异味' },
  42: { id: 42, emoji: '🌶️', name: '香辣鸡排', cat: '荤菜', cal: 420, protein: 26, fat: 24, carbs: 22, fiber: 1, tags: ['人气王'], desc: '外酥里嫩，香辣过瘾' },
  43: { id: 43, emoji: '🍖', name: '椒麻粉蒸排骨', cat: '荤菜', cal: 460, protein: 24, fat: 27, carbs: 30, fiber: 1, tags: [], desc: '椒麻味粉蒸排骨，周三午餐' },
  44: { id: 44, emoji: '🍗', name: '八月瓜烧鸡', cat: '荤菜', cal: 320, protein: 25, fat: 18, carbs: 10, fiber: 1, tags: [], desc: '时令八月瓜与鸡同烧' },
  45: { id: 45, emoji: '🥩', name: '鲜椒烧牛肉', cat: '荤菜', cal: 360, protein: 28, fat: 20, carbs: 12, fiber: 1, tags: ['高蛋白'], desc: '鲜椒提味，牛肉软烂' },
  46: { id: 46, emoji: '🍲', name: '干锅千页豆腐', cat: '素菜', cal: 300, protein: 14, fat: 20, carbs: 16, fiber: 2, tags: [], desc: '千页豆腐干锅味，素食也能香' },
  47: { id: 47, emoji: '🍖', name: '热拌肘子', cat: '荤菜', cal: 440, protein: 26, fat: 32, carbs: 10, fiber: 0, tags: [], desc: '热拌肘子片，周三特色小炒' },
  48: { id: 48, emoji: '🍗', name: '粉蒸鸡腿', cat: '荤菜', cal: 420, protein: 27, fat: 22, carbs: 24, fiber: 1, tags: ['高蛋白'], desc: '米粉蒸鸡腿，咸糯适口' },
  49: { id: 49, emoji: '🍲', name: '冒什锦', cat: '荤菜', cal: 260, protein: 18, fat: 14, carbs: 12, fiber: 2, tags: [], desc: '冒菜式什锦，荤素搭配' },
  50: { id: 50, emoji: '🍖', name: '香芋烧肘子', cat: '荤菜', cal: 470, protein: 26, fat: 30, carbs: 24, fiber: 1, tags: [], desc: '香芋吸油，肘子软糯（周三晚餐）' },
  51: { id: 51, emoji: '🥘', name: '干焙地三鲜', cat: '素菜', cal: 230, protein: 5, fat: 14, carbs: 24, fiber: 4, tags: [], desc: '土豆茄子青椒，东北风味' },
  52: { id: 52, emoji: '🥩', name: '鲜椒炒肉丝', cat: '荤菜', cal: 280, protein: 17, fat: 18, carbs: 10, fiber: 1, tags: [], desc: '鲜椒辛辣，肉丝滑嫩' },
  53: { id: 53, emoji: '🍗', name: '新疆大盘鸡', cat: '荤菜', cal: 420, protein: 28, fat: 24, carbs: 18, fiber: 2, tags: ['人气王'], desc: '鸡块土豆宽皮带汤，分量十足' },
  54: { id: 54, emoji: '🍖', name: '莲藕炖蹄花', cat: '荤菜', cal: 380, protein: 22, fat: 24, carbs: 18, fiber: 1, tags: ['滋补'], desc: '蹄花炖至软糯，莲藕清甜（周四午餐）' },
  55: { id: 55, emoji: '🌶️', name: '尖椒炒鸡杂', cat: '荤菜', cal: 240, protein: 20, fat: 14, carbs: 7, fiber: 1, tags: [], desc: '鸡杂脆嫩，尖椒提味' },
  56: { id: 56, emoji: '🍖', name: '糖醋里脊', cat: '荤菜', cal: 400, protein: 20, fat: 18, carbs: 34, fiber: 1, tags: ['人气王'], desc: '酸甜口，外酥里嫩' },
  57: { id: 57, emoji: '🍖', name: '土豆山药烧排骨', cat: '荤菜', cal: 420, protein: 22, fat: 22, carbs: 30, fiber: 2, tags: [], desc: '土豆山药吸足肉香' },
  58: { id: 58, emoji: '🍖', name: '尖椒炒卤猪头', cat: '荤菜', cal: 380, protein: 16, fat: 30, carbs: 10, fiber: 0, tags: [], desc: '卤猪头肉切片爆炒' },
  59: { id: 59, emoji: '🍖', name: '孜然面筋烤五花', cat: '荤菜', cal: 470, protein: 20, fat: 34, carbs: 16, fiber: 1, tags: [], desc: '烤五花配面筋，孜然浓郁' },
  60: { id: 60, emoji: '🍗', name: '香脆鸡腿', cat: '荤菜', cal: 390, protein: 27, fat: 22, carbs: 14, fiber: 1, tags: [], desc: '周四特色小炒，皮脆肉嫩' },
  61: { id: 61, emoji: '🐟', name: '魔芋烧鱼', cat: '荤菜', cal: 240, protein: 22, fat: 12, carbs: 10, fiber: 0, tags: ['低卡', '高蛋白'], desc: '魔芋低卡吸味，鱼肉嫩（周四晚餐）' },
  62: { id: 62, emoji: '🥘', name: '碎肉泡豇豆', cat: '荤菜', cal: 230, protein: 13, fat: 15, carbs: 10, fiber: 1, tags: [], desc: '酸豇豆开胃下饭' },
  63: { id: 63, emoji: '🥘', name: '韭菜炒肉丝', cat: '荤菜', cal: 250, protein: 13, fat: 16, carbs: 12, fiber: 2, tags: [], desc: '韭菜香气浓，家常快手' },
  64: { id: 64, emoji: '🍤', name: '虾仁三鲜炒蛋', cat: '荤菜', cal: 250, protein: 18, fat: 16, carbs: 8, fiber: 0, tags: ['高蛋白'], desc: '虾仁鸡蛋同炒（含蛋、虾）' },
  65: { id: 65, emoji: '🍖', name: '酸辣粉丝猪肉丸', cat: '荤菜', cal: 330, protein: 14, fat: 14, carbs: 36, fiber: 1.5, tags: [], desc: '猪肉丸配粉丝，酸辣开胃' },
  66: { id: 66, emoji: '🍗', name: '卤鸭拼狼牙土豆', cat: '荤菜', cal: 380, protein: 22, fat: 20, carbs: 26, fiber: 2, tags: [], desc: '卤鸭肉拼狼牙土豆，一菜两吃' },
  67: { id: 67, emoji: '🌶️', name: '尖椒盐菜回锅肉', cat: '荤菜', cal: 340, protein: 15, fat: 24, carbs: 14, fiber: 2, tags: [], desc: '盐菜回锅肉，咸香下饭' },
  68: { id: 68, emoji: '🍖', name: '黄金脆猪排', cat: '荤菜', cal: 450, protein: 24, fat: 28, carbs: 26, fiber: 1, tags: ['人气王'], desc: '炸猪排金黄酥脆' },
  69: { id: 69, emoji: '🍖', name: '土豆排骨', cat: '荤菜', cal: 400, protein: 22, fat: 22, carbs: 26, fiber: 2, tags: ['人气王'], desc: '周五午餐套餐，土豆绵软排骨香' },
  70: { id: 70, emoji: '🥘', name: '鱼香肉丝', cat: '荤菜', cal: 320, protein: 16, fat: 18, carbs: 22, fiber: 2, tags: ['人气王'], desc: '经典川味，咸甜酸辣平衡' },
  71: { id: 71, emoji: '🥘', name: '黄瓜木耳肉片', cat: '荤菜', cal: 220, protein: 13, fat: 13, carbs: 11, fiber: 1.5, tags: ['低卡'], desc: '黄瓜脆木耳滑，肉片适量' },
  72: { id: 72, emoji: '🍖', name: '粉蒸肥肠', cat: '荤菜', cal: 460, protein: 16, fat: 34, carbs: 26, fiber: 1, tags: [], desc: '粉蒸去腻，肥肠糯香' },
  73: { id: 73, emoji: '🍖', name: '香辣炒猪扒', cat: '荤菜', cal: 400, protein: 26, fat: 24, carbs: 16, fiber: 1, tags: [], desc: '猪扒肉香辣过瘾' },
  74: { id: 74, emoji: '🥩', name: '冒卤牛肉', cat: '荤菜', cal: 330, protein: 28, fat: 18, carbs: 10, fiber: 1, tags: ['高蛋白'], desc: '卤牛肉冒菜吃法，牛肉香辣入味' },
  75: { id: 75, emoji: '🍗', name: '奥尔良烤鸡腿', cat: '荤菜', cal: 360, protein: 27, fat: 18, carbs: 16, fiber: 0, tags: ['人气王'], desc: '奥尔良风味微甜带辣' },
  76: { id: 76, emoji: '🍖', name: '尖椒煸卤肘', cat: '荤菜', cal: 430, protein: 25, fat: 30, carbs: 12, fiber: 0, tags: [], desc: '卤肘子煸尖椒，周五晚餐硬菜' },
  77: { id: 77, emoji: '🍳', name: '绍子蒸水蛋', cat: '荤菜', cal: 190, protein: 14, fat: 12, carbs: 5, fiber: 0, tags: ['易消化'], desc: '肉末蒸水蛋，嫩滑（含蛋）' },
  78: { id: 78, emoji: '🥘', name: '蒜台小炒肉', cat: '荤菜', cal: 330, protein: 17, fat: 22, carbs: 14, fiber: 2, tags: [], desc: '蒜台脆嫩，小炒肉香' },
  79: { id: 79, emoji: '🍗', name: '热拌鸡', cat: '荤菜', cal: 300, protein: 24, fat: 18, carbs: 8, fiber: 0, tags: [], desc: '红油热拌鸡块，麻辣鲜香' },
  80: { id: 80, emoji: '🍤', name: '干锅排骨虾', cat: '荤菜', cal: 430, protein: 24, fat: 24, carbs: 24, fiber: 2, tags: ['人气王'], desc: '排骨与虾同锅干煸（含虾）' },
  81: { id: 81, emoji: '🥩', name: '孜然肉片', cat: '荤菜', cal: 340, protein: 20, fat: 22, carbs: 12, fiber: 1, tags: [], desc: '孜然烤肉风味爆炒' },
  82: { id: 82, emoji: '🍗', name: '香辣翅根', cat: '荤菜', cal: 380, protein: 26, fat: 22, carbs: 16, fiber: 1, tags: [], desc: '周日夜宵，翅根香辣入味' },
  83: { id: 83, emoji: '🍗', name: '卤鸭腿', cat: '荤菜', cal: 350, protein: 27, fat: 22, carbs: 8, fiber: 0, tags: [], desc: '卤香鸭腿，肉紧实' },
  84: { id: 84, emoji: '🍗', name: '雪花肉排', cat: '荤菜', cal: 430, protein: 24, fat: 28, carbs: 20, fiber: 1, tags: [], desc: '周一夜宵，雪花纹肉排香煎' },
  85: { id: 85, emoji: '🍳', name: '蛋炒饭（夜宵档）', cat: '主食', cal: 480, protein: 13, fat: 16, carbs: 70, fiber: 2, tags: [], desc: '同119号，夜宵档口' },
  86: { id: 86, emoji: '🍲', name: '南瓜汤（晚餐档）', cat: '汤品', cal: 90, protein: 2, fat: 2, carbs: 19, fiber: 1.5, tags: [], desc: '同130号' },

  // —— 午/晚餐 · 素菜
  87: { id: 87, emoji: '🥬', name: '炝炒下锅耙', cat: '素菜', cal: 90, protein: 3, fat: 6, carbs: 7, fiber: 3, tags: ['高纤维'], desc: '芥菜类叶菜，炝炒脆嫩' },
  88: { id: 88, emoji: '🥬', name: '蒜蓉软江叶', cat: '素菜', cal: 70, protein: 3, fat: 4, carbs: 6, fiber: 3, tags: ['低卡'], desc: '木耳菜滑嫩，蒜蓉清香' },
  89: { id: 89, emoji: '🌽', name: '蒜蓉油麦菜', cat: '素菜', cal: 70, protein: 3, fat: 4, carbs: 6, fiber: 2.5, tags: ['低卡'], desc: '油麦菜清炒，简单低卡' },
  90: { id: 90, emoji: '🥬', name: '青椒土豆丝', cat: '素菜', cal: 120, protein: 3, fat: 6, carbs: 16, fiber: 2, tags: ['人气王'], desc: '酸辣脆爽，国民素菜' },
  91: { id: 91, emoji: '🥬', name: '蒜蓉飘儿白', cat: '素菜', cal: 70, protein: 3, fat: 4, carbs: 6, fiber: 3, tags: ['低卡'], desc: '飘儿白嫩甜，蒜香足' },
  92: { id: 92, emoji: '🥬', name: '清炒绿豆芽', cat: '素菜', cal: 45, protein: 2, fat: 2, carbs: 6, fiber: 1.5, tags: ['低卡'], desc: '极低热量，爽脆' },
  93: { id: 93, emoji: '🥬', name: '炝炒小白菜', cat: '素菜', cal: 65, protein: 3, fat: 3, carbs: 6, fiber: 2.5, tags: ['低卡'], desc: '小白菜炝炒，清香' },
  94: { id: 94, emoji: '🥬', name: '醋溜大白菜', cat: '素菜', cal: 75, protein: 2, fat: 4, carbs: 9, fiber: 2, tags: ['低卡'], desc: '醋香开胃，热量极低' },
  95: { id: 95, emoji: '🥬', name: '金钩冬瓜', cat: '素菜', cal: 85, protein: 5, fat: 4, carbs: 8, fiber: 1.5, tags: ['低卡'], desc: '海米（金钩）烧冬瓜，鲜味足' },
  96: { id: 96, emoji: '🥦', name: '干焙有机花菜', cat: '素菜', cal: 130, protein: 4, fat: 8, carbs: 12, fiber: 3, tags: ['高纤维'], desc: '花菜干焙焦香（周四午餐）' },
  97: { id: 97, emoji: '🥬', name: '清炒三月瓜丝', cat: '素菜', cal: 70, protein: 2, fat: 4, carbs: 7, fiber: 2, tags: ['低卡'], desc: '嫩南瓜丝清炒' },
  98: { id: 98, emoji: '🥬', name: '蒜蓉娃娃菜', cat: '素菜', cal: 60, protein: 3, fat: 3, carbs: 6, fiber: 2.5, tags: ['低卡'], desc: '娃娃菜甜嫩' },
  99: { id: 99, emoji: '🥬', name: '炝炒凤尾', cat: '素菜', cal: 60, protein: 2, fat: 3, carbs: 7, fiber: 2, tags: ['低卡'], desc: '莴笋尖炝炒，脆嫩微苦回甘' },
  100: { id: 100, emoji: '🎃', name: '蜜汁老南瓜', cat: '素菜', cal: 120, protein: 2, fat: 2, carbs: 27, fiber: 2, tags: ['粗粮'], desc: '老南瓜蒸制蜜汁，甜糯' },
  101: { id: 101, emoji: '🥬', name: '蒜蓉生菜', cat: '素菜', cal: 60, protein: 2, fat: 3, carbs: 6, fiber: 2, tags: ['低卡'], desc: '生菜清爽，蒜香点缀' },
  102: { id: 102, emoji: '🥬', name: '糖醋莲白', cat: '素菜', cal: 130, protein: 3, fat: 6, carbs: 18, fiber: 2, tags: [], desc: '莲白糖醋版，酸甜脆口（周五午餐）' },
  103: { id: 103, emoji: '🍄', name: '香菇菜心', cat: '素菜', cal: 80, protein: 3, fat: 4, carbs: 8, fiber: 3, tags: ['高纤维'], desc: '香菇鲜香，菜心碧绿' },
  104: { id: 104, emoji: '🍆', name: '尖椒绍子蒸茄子', cat: '素菜', cal: 180, protein: 6, fat: 12, carbs: 13, fiber: 3, tags: [], desc: '茄子蒸制少油，肉末提香' },
  105: { id: 105, emoji: '🥬', name: '炝炒下锅耙（晚餐）', cat: '素菜', cal: 90, protein: 3, fat: 6, carbs: 7, fiber: 3, tags: [], desc: '同87号' },

  // —— 主食 / 盖浇饭 / 炒饭
  106: { id: 106, emoji: '🍚', name: '红豆饭', cat: '主食', cal: 260, protein: 7, fat: 2, carbs: 54, fiber: 4, tags: ['粗粮'], desc: '红豆米饭，周一晚餐主食' },
  107: { id: 107, emoji: '🍚', name: '燕麦饭', cat: '主食', cal: 250, protein: 7, fat: 3, carbs: 48, fiber: 5, tags: ['粗粮', '低GI'], desc: '燕麦掺米饭，膳食纤维高' },
  108: { id: 108, emoji: '🍚', name: '小米饭', cat: '主食', cal: 240, protein: 6, fat: 2, carbs: 50, fiber: 3, tags: ['粗粮'], desc: '小米米饭，养胃' },
  109: { id: 109, emoji: '🍚', name: '红薯饭', cat: '主食', cal: 250, protein: 5, fat: 1, carbs: 55, fiber: 3, tags: ['粗粮'], desc: '红薯掺米饭，周三午餐主食' },
  110: { id: 110, emoji: '🍚', name: '绿豆饭', cat: '主食', cal: 255, protein: 7, fat: 2, carbs: 52, fiber: 3.5, tags: ['粗粮'], desc: '绿豆米饭，清热' },
  111: { id: 111, emoji: '🍚', name: '玉米掺饭', cat: '主食', cal: 245, protein: 5, fat: 2, carbs: 52, fiber: 3, tags: ['粗粮'], desc: '周四午餐主食' },
  112: { id: 112, emoji: '🍚', name: '胡萝卜饭', cat: '主食', cal: 250, protein: 5, fat: 2, carbs: 53, fiber: 3, tags: [], desc: '胡萝卜焖饭，周四晚餐主食' },
  113: { id: 113, emoji: '🍚', name: '南瓜饭', cat: '主食', cal: 250, protein: 5, fat: 2, carbs: 53, fiber: 2.5, tags: ['粗粮'], desc: '南瓜焖饭，清甜' },
  114: { id: 114, emoji: '🍚', name: '红苕饭', cat: '主食', cal: 250, protein: 5, fat: 2, carbs: 54, fiber: 3, tags: ['粗粮'], desc: '红苕（红薯）焖饭' },
  115: { id: 115, emoji: '🍛', name: '烧椒卤肘盖浇饭', cat: '主食', cal: 700, protein: 24, fat: 28, carbs: 90, fiber: 3, tags: ['人气王'], desc: '烧椒卤肘浇饭，分量足' },
  116: { id: 116, emoji: '🍛', name: '卤排骨盖浇饭', cat: '主食', cal: 690, protein: 23, fat: 27, carbs: 89, fiber: 3, tags: ['人气王'], desc: '卤排骨浇饭（周五 2035 贯通窗口）' },
  117: { id: 117, emoji: '🍛', name: '五彩碎肉芽菜炒饭', cat: '主食', cal: 540, protein: 16, fat: 16, carbs: 80, fiber: 3, tags: [], desc: '碎肉芽菜炒饭，五色配菜' },
  118: { id: 118, emoji: '🍛', name: '土豆排骨盖浇饭', cat: '主食', cal: 660, protein: 22, fat: 24, carbs: 86, fiber: 3, tags: [], desc: '周日晚餐盖浇饭' },
  119: { id: 119, emoji: '🍳', name: '蛋炒饭', cat: '主食', cal: 480, protein: 13, fat: 16, carbs: 70, fiber: 2, tags: ['人气王'], desc: '夜宵经典蛋炒饭（含蛋）' },
  120: { id: 120, emoji: '🍗', name: '韩式鸡柳拌饭', cat: '主食', cal: 560, protein: 24, fat: 16, carbs: 82, fiber: 2, tags: [], desc: '甜辣鸡柳拌饭（周四炒饭档）' },

  // —— 汤品
  121: { id: 121, emoji: '🍲', name: '青瓜三鲜汤', cat: '汤品', cal: 55, protein: 4, fat: 2, carbs: 5, fiber: 1, tags: ['低卡'], desc: '黄瓜三鲜汤，清爽解腻' },
  122: { id: 122, emoji: '🍲', name: '时蔬豆腐汤', cat: '汤品', cal: 80, protein: 6, fat: 4, carbs: 6, fiber: 1, tags: ['低卡'], desc: '时蔬豆腐，植物蛋白' },
  123: { id: 123, emoji: '🍲', name: '紫菜蛋花汤', cat: '汤品', cal: 45, protein: 4, fat: 2, carbs: 3, fiber: 0.5, tags: ['低卡'], desc: '经典快手汤（含蛋）' },
  124: { id: 124, emoji: '🍲', name: '虾皮带丝汤', cat: '汤品', cal: 70, protein: 6, fat: 3, carbs: 4, fiber: 0.5, tags: [], desc: '虾皮海带丝汤，补钙（含虾）' },
  125: { id: 125, emoji: '🍲', name: '萝卜连锅汤', cat: '汤品', cal: 180, protein: 14, fat: 10, carbs: 7, fiber: 1, tags: [], desc: '川味连锅汤，肉片萝卜同煮' },
  126: { id: 126, emoji: '🍲', name: '番茄圆子汤', cat: '汤品', cal: 150, protein: 10, fat: 7, carbs: 10, fiber: 1, tags: [], desc: '肉圆子番茄汤（2035 贯通窗口）' },
  127: { id: 127, emoji: '🍲', name: '绿豆汤', cat: '汤品', cal: 110, protein: 4, fat: 0.5, carbs: 24, fiber: 2, tags: ['低卡'], desc: '清热解暑，周四晚餐' },
  128: { id: 128, emoji: '🍲', name: '西红柿蛋花汤', cat: '汤品', cal: 65, protein: 4, fat: 3, carbs: 5, fiber: 0.5, tags: ['低卡'], desc: '周五午餐汤品（含蛋）' },
  129: { id: 129, emoji: '🍲', name: '酸菜粉丝汤', cat: '汤品', cal: 120, protein: 4, fat: 3, carbs: 21, fiber: 1, tags: [], desc: '酸辣开胃，粉丝滑溜' },
  130: { id: 130, emoji: '🍲', name: '南瓜汤', cat: '汤品', cal: 90, protein: 2, fat: 2, carbs: 19, fiber: 1.5, tags: ['低卡'], desc: '周日晚餐汤品，甜糯' },

  // —— 面食 / 米线 / 饺子馄饨
  131: { id: 131, emoji: '🍜', name: '西红柿鸡蛋面', cat: '面食', cal: 430, protein: 14, fat: 11, carbs: 68, fiber: 1.5, tags: ['人气王'], desc: '早餐夜宵都供应（含蛋、麸质）' },
  132: { id: 132, emoji: '🍜', name: '榨菜绍子面', cat: '面食', cal: 440, protein: 14, fat: 11, carbs: 68, fiber: 2, tags: [], desc: '榨菜肉末面，周一早餐' },
  133: { id: 133, emoji: '🍜', name: '豌豆绍子面', cat: '面食', cal: 450, protein: 15, fat: 11, carbs: 70, fiber: 2.5, tags: [], desc: '豌豆肉末面，周三早餐' },
  134: { id: 134, emoji: '🍜', name: '泡椒鸡杂面', cat: '面食', cal: 460, protein: 17, fat: 12, carbs: 68, fiber: 2, tags: [], desc: '泡椒酸辣，鸡杂脆嫩' },
  135: { id: 135, emoji: '🥟', name: '藤椒馄饨', cat: '面食', cal: 400, protein: 16, fat: 12, carbs: 58, fiber: 1.5, tags: [], desc: '藤椒麻香馄饨，周二面食' },
  136: { id: 136, emoji: '🥟', name: '清汤馄饨', cat: '面食', cal: 380, protein: 16, fat: 10, carbs: 56, fiber: 1.5, tags: ['易消化'], desc: '清汤大馅，周四早餐' },
  137: { id: 137, emoji: '🥟', name: '鸡汤馄饨', cat: '面食', cal: 420, protein: 18, fat: 14, carbs: 54, fiber: 2, tags: [], desc: '鸡汤打底（周二 2035 贯通窗口）' },
  138: { id: 138, emoji: '🍜', name: '特色炒刀削面', cat: '面食', cal: 560, protein: 18, fat: 18, carbs: 78, fiber: 3, tags: ['人气王'], desc: '周二晚餐炒饭档，刀削筋道' },
  139: { id: 139, emoji: '🍜', name: '酸菜乌鱼米线', cat: '面食', cal: 480, protein: 22, fat: 12, carbs: 72, fiber: 2, tags: ['人气王'], desc: '乌鱼片酸菜汤底，周三面食' },
  140: { id: 140, emoji: '🍜', name: '酸菜乌鱼面', cat: '面食', cal: 460, protein: 21, fat: 11, carbs: 70, fiber: 2, tags: [], desc: '同139号，面条版' },
  141: { id: 141, emoji: '🍜', name: '海带炖鸡面', cat: '面食', cal: 440, protein: 19, fat: 12, carbs: 66, fiber: 2, tags: [], desc: '鸡汤海带，滋补（周四面食/2035窗口）' },
  142: { id: 142, emoji: '🍜', name: '绍子酸辣粉', cat: '面食', cal: 380, protein: 8, fat: 12, carbs: 60, fiber: 2, tags: [], desc: '红薯粉酸辣开胃' },
  143: { id: 143, emoji: '🍜', name: '酸辣三鲜烩面皮', cat: '面食', cal: 420, protein: 12, fat: 14, carbs: 64, fiber: 2.5, tags: [], desc: '面皮烩三鲜，周三晚餐特色' },
  144: { id: 144, emoji: '🥟', name: '煮水饺', cat: '面食', cal: 420, protein: 17, fat: 12, carbs: 60, fiber: 2, tags: ['人气王'], desc: '周三夜宵水饺（含麸质）' },
  145: { id: 145, emoji: '🥟', name: '红油水饺', cat: '面食', cal: 450, protein: 17, fat: 14, carbs: 62, fiber: 2, tags: ['人气王'], desc: '红油甜辣，周日晚餐' },
  146: { id: 146, emoji: '🥟', name: '蒸饺', cat: '面食', cal: 260, protein: 10, fat: 8, carbs: 36, fiber: 1.5, tags: [], desc: '周五早餐蒸饺' },
  147: { id: 147, emoji: '🥟', name: '炸蒸饺', cat: '面食', cal: 320, protein: 10, fat: 14, carbs: 38, fiber: 1.5, tags: [], desc: '周四夜宵炸饺，外酥里嫩' },
  148: { id: 148, emoji: '🍜', name: '热拌面', cat: '面食', cal: 430, protein: 12, fat: 12, carbs: 68, fiber: 2, tags: [], desc: '红油热拌，周三夜宵' },
  149: { id: 149, emoji: '🍜', name: '热拌河粉', cat: '面食', cal: 420, protein: 14, fat: 12, carbs: 64, fiber: 1.5, tags: [], desc: '周一夜宵河粉' },
  150: { id: 150, emoji: '🍜', name: '酸汤肉丝河粉', cat: '面食', cal: 430, protein: 16, fat: 12, carbs: 66, fiber: 1.5, tags: [], desc: '周日夜宵酸汤河粉' },
  151: { id: 151, emoji: '🍜', name: '酸菜肉丝面', cat: '面食', cal: 420, protein: 15, fat: 12, carbs: 64, fiber: 2, tags: [], desc: '周五夜宵酸菜肉丝（面）' },
  152: { id: 152, emoji: '🍜', name: '青椒肉丝炒面', cat: '面食', cal: 520, protein: 18, fat: 16, carbs: 74, fiber: 2.5, tags: [], desc: '炒面配卤鸡腿（2035 贯通窗口）' },

  // —— 早餐 · 粥/蛋/奶/包点
  153: { id: 153, emoji: '🥣', name: '玉米粥', cat: '粥品', cal: 95, protein: 3, fat: 1, carbs: 20, fiber: 1, tags: ['低卡'], desc: '周一早餐粥' },
  154: { id: 154, emoji: '🥣', name: '南瓜粥', cat: '粥品', cal: 85, protein: 2, fat: 0.5, carbs: 19, fiber: 1, tags: ['低卡'], desc: '周二早餐粥，甜糯' },
  155: { id: 155, emoji: '🥣', name: '黑米粥', cat: '粥品', cal: 100, protein: 3, fat: 1, carbs: 21, fiber: 1.5, tags: ['粗粮'], desc: '周三早餐粥' },
  156: { id: 156, emoji: '🥣', name: '红薯粥', cat: '粥品', cal: 90, protein: 2, fat: 0.5, carbs: 20, fiber: 1, tags: ['低卡'], desc: '周四早餐粥' },
  157: { id: 157, emoji: '🥣', name: '蔬菜瘦肉粥', cat: '粥品', cal: 130, protein: 6, fat: 2, carbs: 22, fiber: 1.5, tags: ['营养均衡'], desc: '周五早餐粥，有肉有菜' },
  158: { id: 158, emoji: '🥚', name: '营养蛋', cat: '小吃', cal: 75, protein: 7, fat: 5, carbs: 1, fiber: 0, tags: ['高蛋白'], desc: '每日早餐固定供应的水煮蛋' },
  159: { id: 159, emoji: '🥚', name: '卤蛋', cat: '小吃', cal: 85, protein: 7, fat: 6, carbs: 1, fiber: 0, tags: ['高蛋白'], desc: '卤香入味（含蛋）' },
  160: { id: 160, emoji: '🍳', name: '煎荷包蛋', cat: '小吃', cal: 115, protein: 7, fat: 9, carbs: 1, fiber: 0, tags: ['高蛋白'], desc: '周一早餐（含蛋）' },
  161: { id: 161, emoji: '🍳', name: '蒸水蛋', cat: '小吃', cal: 95, protein: 7, fat: 6, carbs: 2, fiber: 0, tags: ['易消化'], desc: '嫩滑水蒸蛋（含蛋）' },
  162: { id: 162, emoji: '🥛', name: '学生纯牛奶', cat: '饮品', cal: 130, protein: 7, fat: 5, carbs: 13, fiber: 0, tags: ['补钙'], desc: '每日早餐固定供应 250ml（含乳制品）' },
  163: { id: 163, emoji: '🥛', name: '豆浆', cat: '饮品', cal: 70, protein: 6, fat: 3, carbs: 5, fiber: 1, tags: ['低卡', '高蛋白'], desc: '现磨豆浆，植物蛋白' },
  164: { id: 164, emoji: '🥖', name: '莲白肉包', cat: '包点', cal: 230, protein: 8, fat: 7, carbs: 34, fiber: 1.5, tags: [], desc: '莲白猪肉大包（含麸质）' },
  165: { id: 165, emoji: '🥖', name: '酱肉包', cat: '包点', cal: 260, protein: 9, fat: 9, carbs: 35, fiber: 1.5, tags: ['人气王'], desc: '甜面酱肉馅（含麸质）' },
  166: { id: 166, emoji: '🥖', name: '奶香馒头', cat: '包点', cal: 230, protein: 7, fat: 3, carbs: 45, fiber: 1, tags: [], desc: '奶香馒头（含麸质、乳制品）' },
  167: { id: 167, emoji: '🥖', name: '胡萝卜花卷', cat: '包点', cal: 220, protein: 7, fat: 5, carbs: 38, fiber: 2, tags: [], desc: '胡萝卜花卷（含麸质）' },
  168: { id: 168, emoji: '🍩', name: '油条', cat: '小吃', cal: 270, protein: 5, fat: 15, carbs: 30, fiber: 1, tags: ['人气王'], desc: '每日早餐供应（含麸质）' },
  169: { id: 169, emoji: '🍠', name: '蒸红薯', cat: '小吃', cal: 105, protein: 2, fat: 0.5, carbs: 24, fiber: 3, tags: ['粗粮', '低GI'], desc: '周五早餐粗粮' },
  170: { id: 170, emoji: '🌽', name: '煮玉米棒', cat: '小吃', cal: 160, protein: 5, fat: 2, carbs: 34, fiber: 3, tags: ['粗粮'], desc: '周二早餐粗粮' },

  // —— 夜宵 / 小吃
  171: { id: 171, emoji: '🥗', name: '拌卤素什锦', cat: '小吃', cal: 120, protein: 5, fat: 7, carbs: 11, fiber: 4, tags: ['高纤维', '低卡'], desc: '多种蔬菜卤味凉拌' },
  172: { id: 172, emoji: '🥔', name: '锅巴土豆', cat: '小吃', cal: 270, protein: 5, fat: 12, carbs: 36, fiber: 3, tags: [], desc: '炸土豆锅巴口感，撒料香辣' },
  173: { id: 173, emoji: '🥔', name: '折耳根狼牙土豆', cat: '小吃', cal: 260, protein: 4, fat: 12, carbs: 34, fiber: 3, tags: [], desc: '折耳根拌狼牙土豆，周日夜宵' },
  174: { id: 174, emoji: '🍟', name: '茄汁薯条', cat: '小吃', cal: 280, protein: 4, fat: 12, carbs: 38, fiber: 2, tags: [], desc: '周五夜宵薯条配茄汁' },
  175: { id: 175, emoji: '🌶️', name: '孜然面筋', cat: '小吃', cal: 280, protein: 14, fat: 16, carbs: 20, fiber: 1, tags: [], desc: '孜然烤面筋（含麸质）' },
  176: { id: 176, emoji: '🍮', name: '椰奶布丁', cat: '小吃', cal: 210, protein: 3, fat: 9, carbs: 30, fiber: 0, tags: [], desc: '周四夜宵甜品（含乳制品）' },
  177: { id: 177, emoji: '🍞', name: '肉松三明治', cat: '小吃', cal: 360, protein: 12, fat: 14, carbs: 46, fiber: 1.5, tags: [], desc: '周日夜宵三明治（含麸质、蛋）' },

  // —— 本周菜单补全（第13周全部条目均有营养卡）
  178: { id: 178, emoji: '🥬', name: '炒黄豆芽', cat: '素菜', cal: 80, protein: 5, fat: 4, carbs: 7, fiber: 2, tags: ['低卡'], desc: '周一早餐素菜' },
  179: { id: 179, emoji: '🍥', name: '地瓜丸', cat: '小吃', cal: 220, protein: 4, fat: 8, carbs: 34, fiber: 1.5, tags: [], desc: '周一早餐点心' },
  180: { id: 180, emoji: '🍡', name: '黑米糕', cat: '小吃', cal: 240, protein: 4, fat: 5, carbs: 44, fiber: 1.5, tags: ['粗粮'], desc: '周一早餐点心' },
  181: { id: 181, emoji: '🍰', name: '草莓蛋糕', cat: '小吃', cal: 280, protein: 4, fat: 10, carbs: 44, fiber: 1, tags: [], desc: '周一早餐点心' },
  182: { id: 182, emoji: '🍞', name: '墨西哥面包', cat: '包点', cal: 320, protein: 7, fat: 11, carbs: 50, fiber: 1.5, tags: [], desc: '周一早餐面包（含麸质）' },
  183: { id: 183, emoji: '🍆', name: '酱烧茄子', cat: '素菜', cal: 160, protein: 4, fat: 10, carbs: 14, fiber: 3, tags: ['人气王'], desc: '周一午餐套餐素菜，酱香浓郁' },
  184: { id: 184, emoji: '🍞', name: '红豆肉松面包', cat: '包点', cal: 350, protein: 8, fat: 12, carbs: 52, fiber: 1.5, tags: [], desc: '周一夜宵面包（含麸质）' },
  185: { id: 185, emoji: '🥖', name: '芽菜肉包', cat: '包点', cal: 240, protein: 8, fat: 7, carbs: 36, fiber: 1.5, tags: [], desc: '周二早餐包子（含麸质）' },
  186: { id: 186, emoji: '🥖', name: '豆沙馒头', cat: '包点', cal: 260, protein: 7, fat: 4, carbs: 50, fiber: 1.5, tags: [], desc: '周二早餐馒头（含麸质）' },
  187: { id: 187, emoji: '🥬', name: '炒青笋尖', cat: '素菜', cal: 60, protein: 2, fat: 3, carbs: 6, fiber: 2, tags: ['低卡'], desc: '周二早餐素菜' },
  188: { id: 188, emoji: '🌯', name: '炸春卷', cat: '小吃', cal: 260, protein: 6, fat: 12, carbs: 30, fiber: 1.5, tags: [], desc: '周二早餐点心' },
  189: { id: 189, emoji: '🥟', name: '猪肉烧麦', cat: '包点', cal: 280, protein: 9, fat: 11, carbs: 36, fiber: 1.5, tags: [], desc: '周二早餐点心（含麸质）' },
  190: { id: 190, emoji: '🍰', name: '香妃蛋糕', cat: '小吃', cal: 290, protein: 5, fat: 11, carbs: 43, fiber: 1, tags: [], desc: '周二早餐点心' },
  191: { id: 191, emoji: '🍞', name: '肉松面包', cat: '包点', cal: 340, protein: 8, fat: 12, carbs: 50, fiber: 1.5, tags: [], desc: '周二早餐面包（含麸质、蛋）' },
  192: { id: 192, emoji: '🥬', name: '蒜蓉菠菜', cat: '素菜', cal: 80, protein: 4, fat: 4, carbs: 7, fiber: 4, tags: ['补铁', '高纤维'], desc: '周二晚餐套餐素菜' },
  193: { id: 193, emoji: '🍞', name: '芝士鸡排面包', cat: '包点', cal: 420, protein: 14, fat: 18, carbs: 50, fiber: 2, tags: [], desc: '周一夜宵面包（含麸质、乳制品）' },
  194: { id: 194, emoji: '🥖', name: '麻辣花卷', cat: '包点', cal: 230, protein: 7, fat: 6, carbs: 38, fiber: 1.5, tags: [], desc: '周三早餐花卷（含麸质）' },
  195: { id: 195, emoji: '🥬', name: '炒油麦菜', cat: '素菜', cal: 65, protein: 2, fat: 3, carbs: 6, fiber: 2, tags: ['低卡'], desc: '周三早餐素菜' },
  196: { id: 196, emoji: '🍗', name: '黑椒鸡块', cat: '小吃', cal: 290, protein: 16, fat: 16, carbs: 20, fiber: 1, tags: [], desc: '周三早餐点心' },
  197: { id: 197, emoji: '🍡', name: '花瓣南瓜糕', cat: '小吃', cal: 250, protein: 4, fat: 6, carbs: 44, fiber: 1.5, tags: ['粗粮'], desc: '周三早餐点心' },
  198: { id: 198, emoji: '🍰', name: '巧克力蛋糕', cat: '小吃', cal: 320, protein: 5, fat: 13, carbs: 45, fiber: 1.5, tags: [], desc: '周三早餐点心' },
  199: { id: 199, emoji: '🍞', name: '菠萝奶酥面包', cat: '包点', cal: 350, protein: 6, fat: 13, carbs: 53, fiber: 1.5, tags: [], desc: '周三早餐面包（含麸质、乳制品）' },
  200: { id: 200, emoji: '🥖', name: '翡翠馒头', cat: '包点', cal: 235, protein: 6, fat: 3, carbs: 46, fiber: 1.5, tags: [], desc: '周三早餐馒头（含麸质）' },
  201: { id: 201, emoji: '🥘', name: '碎肉土豆泥', cat: '荤菜', cal: 210, protein: 9, fat: 10, carbs: 22, fiber: 2, tags: [], desc: '周三午餐套餐，绵软易消化' },
  202: { id: 202, emoji: '🍞', name: '玉米芝士面包', cat: '包点', cal: 360, protein: 9, fat: 13, carbs: 51, fiber: 2, tags: [], desc: '周三夜宵面包（含麸质、乳制品）' },
  203: { id: 203, emoji: '🥖', name: '酸菜肉包', cat: '包点', cal: 240, protein: 8, fat: 7, carbs: 35, fiber: 1.5, tags: [], desc: '周四早餐包子（含麸质）' },
  204: { id: 204, emoji: '🥖', name: '红枣馒头', cat: '包点', cal: 250, protein: 6, fat: 3, carbs: 50, fiber: 2, tags: ['粗粮'], desc: '周四早餐馒头（含麸质）' },
  205: { id: 205, emoji: '🥖', name: '果酱花卷', cat: '包点', cal: 250, protein: 6, fat: 6, carbs: 44, fiber: 1, tags: [], desc: '周四早餐花卷（含麸质）' },
  206: { id: 206, emoji: '🥬', name: '炒小白菜', cat: '素菜', cal: 60, protein: 2, fat: 3, carbs: 6, fiber: 2.5, tags: ['低卡'], desc: '周四早餐素菜' },
  207: { id: 207, emoji: '🍩', name: '炸油条', cat: '小吃', cal: 270, protein: 5, fat: 15, carbs: 30, fiber: 1, tags: [], desc: '周四早餐现炸油条（含麸质）' },
  208: { id: 208, emoji: '🥠', name: '蒸窝窝头', cat: '包点', cal: 180, protein: 5, fat: 2, carbs: 38, fiber: 4, tags: ['粗粮', '低GI'], desc: '周四早餐粗粮（含麸质）' },
  209: { id: 209, emoji: '🍰', name: '岩烧蛋糕', cat: '小吃', cal: 300, protein: 5, fat: 12, carbs: 43, fiber: 1, tags: [], desc: '周四早餐点心' },
  210: { id: 210, emoji: '🍞', name: '海苔肉松吐司', cat: '包点', cal: 330, protein: 8, fat: 11, carbs: 49, fiber: 1.5, tags: [], desc: '周四早餐吐司（含麸质、蛋）' },
  211: { id: 211, emoji: '🥔', name: '烤土豆', cat: '小吃', cal: 150, protein: 3, fat: 4, carbs: 26, fiber: 3, tags: ['粗粮'], desc: '周四早餐（教师档）低油烤制' },
  212: { id: 212, emoji: '🥖', name: '藕丁肉包', cat: '包点', cal: 230, protein: 8, fat: 6, carbs: 36, fiber: 2, tags: [], desc: '周五早餐包子（含麸质）' },
  213: { id: 213, emoji: '🥖', name: '黑米馒头', cat: '包点', cal: 240, protein: 6, fat: 3, carbs: 47, fiber: 2, tags: ['粗粮'], desc: '周五早餐馒头（含麸质）' },
  214: { id: 214, emoji: '🥬', name: '炒飘儿白', cat: '素菜', cal: 60, protein: 2, fat: 3, carbs: 6, fiber: 2.5, tags: ['低卡'], desc: '周五早餐素菜' },
  215: { id: 215, emoji: '🥖', name: '双色花卷', cat: '包点', cal: 230, protein: 6, fat: 5, carbs: 42, fiber: 1.5, tags: [], desc: '周五早餐花卷（含麸质）' },
  216: { id: 216, emoji: '🍡', name: '芝麻球', cat: '小吃', cal: 250, protein: 5, fat: 10, carbs: 36, fiber: 1.5, tags: [], desc: '周五早餐点心' },
  217: { id: 217, emoji: '🍰', name: '枣香蛋糕', cat: '小吃', cal: 280, protein: 4, fat: 9, carbs: 46, fiber: 1, tags: [], desc: '周五早餐点心' },
  218: { id: 218, emoji: '🍞', name: '玉米火腿面包', cat: '包点', cal: 340, protein: 9, fat: 11, carbs: 50, fiber: 1.5, tags: [], desc: '周五早餐面包（含麸质）' },
  219: { id: 219, emoji: '🍅', name: '西红柿炒蛋', cat: '素菜', cal: 190, protein: 9, fat: 13, carbs: 9, fiber: 1, tags: ['营养均衡', '家常'], desc: '周五午餐特色小炒（含蛋）' },
  220: { id: 220, emoji: '🍜', name: '笋子牛肉刀削面', cat: '面食', cal: 520, protein: 20, fat: 14, carbs: 78, fiber: 2, tags: ['高蛋白'], desc: '周五午餐面食（含麸质）' },
  221: { id: 221, emoji: '🍜', name: '酸菜肉丝', cat: '面食', cal: 380, protein: 15, fat: 10, carbs: 60, fiber: 2, tags: [], desc: '周五夜宵酸菜肉丝（面）（含麸质）' },
  222: { id: 222, emoji: '🍞', name: '面包', cat: '包点', cal: 280, protein: 7, fat: 8, carbs: 46, fiber: 1.5, tags: [], desc: '周五夜宵普通面包（含麸质）' },
};

// ─── 一周菜单（学生食谱第13周 · 2026-05-25 ~ 05-31，真实食谱）──
const weeklyMenu = {
  week: '第13周',
  dateRange: '2026-05-25 ~ 2026-05-31',
  days: [
    { day: '星期一', date: '2026-05-25', meals: [
      { meal: '早餐', lines: [
        { line: '选餐', items: ['玉米粥', '营养蛋', '莲白肉包', '胡萝卜花卷', '奶香馒头', '学生纯牛奶', '炒黄豆芽'] },
        { line: '选餐', items: ['榨菜绍子面', '地瓜丸', '黑米糕', '草莓蛋糕', '墨西哥面包', '油条', '豆浆', '煎荷包蛋'] },
      ]},
      { meal: '午餐', lines: [
        { line: '套餐', items: ['干锅排骨', '碎肉豌豆', '酱烧茄子', '炝炒下锅耙', '银耳汤', '豆腐烧三鲜（鱿鱼三文治鱼豆腐）'] },
        { line: '2035贯通窗口', items: ['红烧狮子头'] },
        { line: '主食', items: ['玉米饭'] },
        { line: '素菜', items: ['蒜蓉软江叶'] },
        { line: '特色小炒', items: ['甜皮鸭', '外婆菜炒鸡粒', '番茄牛腩', '豆腐烧三鲜（鱿鱼三文治鱼豆腐）', '脆皮鸡腿'] },
        { line: '面食', items: ['素椒杂酱面'] },
      ]},
      { meal: '晚餐', lines: [
        { line: '套餐', items: ['胡萝卜烧肘子', '莲白肉片', '青椒萝卜干回锅肉', '蒜蓉西兰花', '青瓜三鲜汤', '虾仁绍子蒸蛋'] },
        { line: '盖浇饭', items: ['台式卤肉盖浇饭'] },
        { line: '主食', items: ['红豆饭'] },
        { line: '素菜', items: ['双椒玉米'] },
        { line: '特色小炒', items: ['钵钵鸡', '虾仁绍子蒸蛋', '水煮肉片', '茄汁藕盒', '卤鸡腿'] },
      ]},
      { meal: '夜宵', lines: [
        { line: '夜宵', items: ['拌卤素什锦', '卤蛋', '西红柿鸡蛋面', '红豆肉松面包'] },
      ]},
    ]},
    { day: '星期二', date: '2026-05-26', meals: [
      { meal: '早餐', lines: [
        { line: '选餐', items: ['南瓜粥', '营养蛋', '卤蛋', '芽菜肉包', '豆沙馒头', '煮玉米棒', '学生纯牛奶', '炒青笋尖'] },
        { line: '选餐', items: ['西红柿鸡蛋面', '炸春卷', '猪肉烧麦', '香妃蛋糕', '肉松面包', '油条', '豆浆'] },
      ]},
      { meal: '午餐', lines: [
        { line: '套餐', items: ['狼牙土豆鸡', '莲藕炒肉片', '麻婆豆腐', '蒜蓉飘儿白', '时蔬豆腐汤', '山椒兔'] },
        { line: '主食', items: ['燕麦饭'] },
        { line: '素菜', items: ['青椒土豆丝'] },
        { line: '特色小炒', items: ['糯米粉蒸排骨', '番茄烩三鲜', '豆花龙利鱼', '孜然卤肉', '功夫鸭腿'] },
        { line: '面食', items: ['藤椒馄饨'] },
      ]},
      { meal: '晚餐', lines: [
        { line: '套餐', items: ['黄豆花生烧猪脚', '三月瓜炒肉丝', '苦瓜肉片', '蒜蓉菠菜', '冬瓜肉片汤', '黑椒鸡丁'] },
        { line: '2035贯通窗口', items: ['鸡汤馄饨'] },
        { line: '主食', items: ['小米饭'] },
        { line: '素菜', items: ['清炒绿豆芽'] },
        { line: '特色小炒', items: ['萝卜烧牛腩', '黑椒鸡丁', '干煸肥肠', '仔姜跳水兔', '香辣鸡排'] },
        { line: '炒饭/面', items: ['特色炒刀削面'] },
      ]},
      { meal: '夜宵', lines: [
        { line: '夜宵', items: ['热拌河粉', '雪花肉排', '孜然面筋', '芝士鸡排面包'] },
      ]},
    ]},
    { day: '星期三', date: '2026-05-27', meals: [
      { meal: '早餐', lines: [
        { line: '选餐', items: ['黑米粥', '营养蛋', '酱肉包', '麻辣花卷', '学生纯牛奶', '炒油麦菜', '蒸水蛋'] },
        { line: '选餐', items: ['豌豆绍子面', '黑椒鸡块', '花瓣南瓜糕', '巧克力蛋糕', '菠萝奶酥面包', '油条', '豆浆', '翡翠馒头'] },
      ]},
      { meal: '午餐', lines: [
        { line: '套餐', items: ['椒麻粉蒸排骨', '八月瓜烧鸡', '绍子酸辣粉', '炝炒小白菜', '紫菜蛋花汤', '碎肉土豆泥'] },
        { line: '主食', items: ['红薯饭'] },
        { line: '素菜', items: ['蒜蓉油麦菜'] },
        { line: '2035贯通窗口', items: ['青椒肉丝炒面+卤鸡腿'] },
        { line: '特色小炒', items: ['鲜椒烧牛肉', '干锅千页豆腐', '热拌肘子', '碎肉土豆泥', '粉蒸鸡腿'] },
        { line: '面食', items: ['酸菜乌鱼米线', '酸菜乌鱼面'] },
      ]},
      { meal: '晚餐', lines: [
        { line: '套餐', items: ['香芋烧肘子', '番茄炒蛋', '干焙地三鲜', '醋溜大白菜', '虾皮带丝汤', '冒什锦'] },
        { line: '盖浇饭', items: ['烧椒卤肘盖浇饭'] },
        { line: '主食', items: ['绿豆饭'] },
        { line: '素菜', items: ['金钩冬瓜'] },
        { line: '特色小炒', items: ['冒什锦', '鲜椒炒肉丝', '新疆大盘鸡', '酸辣三鲜烩面皮', '锅巴土豆'] },
      ]},
      { meal: '夜宵', lines: [
        { line: '夜宵', items: ['煮水饺', '热拌面', '卤鸡腿', '玉米芝士面包'] },
      ]},
    ]},
    { day: '星期四', date: '2026-05-28', meals: [
      { meal: '早餐', lines: [
        { line: '选餐', items: ['红薯粥', '卤蛋', '营养蛋', '酸菜肉包', '红枣馒头', '果酱花卷', '学生纯牛奶', '炒小白菜'] },
        { line: '选餐', items: ['清汤馄饨', '炸油条', '蒸窝窝头', '岩烧蛋糕', '海苔肉松吐司', '烤土豆（教师）', '豆浆'] },
      ]},
      { meal: '午餐', lines: [
        { line: '套餐', items: ['莲藕炖蹄花', '干焙有机花菜', '尖椒炒鸡杂', '清炒三月瓜丝', '萝卜连锅汤', '糖醋里脊'] },
        { line: '2035贯通窗口', items: ['番茄圆子汤'] },
        { line: '主食', items: ['玉米掺饭'] },
        { line: '素菜', items: ['蒜蓉娃娃菜'] },
        { line: '特色小炒', items: ['土豆山药烧排骨', '糖醋里脊', '尖椒炒卤猪头', '孜然面筋烤五花', '香脆鸡腿'] },
        { line: '面食', items: ['海带炖鸡面'] },
      ]},
      { meal: '晚餐', lines: [
        { line: '套餐', items: ['魔芋烧鱼', '碎肉泡豇豆', '韭菜炒肉丝', '炝炒凤尾', '绿豆汤', '虾仁三鲜炒蛋'] },
        { line: '主食', items: ['胡萝卜饭'] },
        { line: '素菜', items: ['蜜汁老南瓜'] },
        { line: '特色小炒', items: ['酸辣粉丝猪肉丸', '卤鸭拼狼牙土豆', '虾仁三鲜炒蛋', '尖椒盐菜回锅肉', '黄金脆猪排'] },
        { line: '2035贯通窗口', items: ['海带炖鸡面'] },
        { line: '炒饭', items: ['韩式鸡柳拌饭'] },
      ]},
      { meal: '夜宵', lines: [
        { line: '夜宵', items: ['蛋炒饭', '卤鸭腿', '炸蒸饺', '椰奶布丁'] },
      ]},
    ]},
    { day: '星期五', date: '2026-05-29', meals: [
      { meal: '早餐', lines: [
        { line: '选餐', items: ['蔬菜瘦肉粥', '营养蛋', '藕丁肉包', '黑米馒头', '蒸红薯', '学生纯牛奶', '炒飘儿白', '双色花卷'] },
        { line: '选餐', items: ['泡椒鸡杂面', '蒸饺', '芝麻球', '枣香蛋糕', '玉米火腿面包', '油条', '豆浆'] },
      ]},
      { meal: '午餐', lines: [
        { line: '套餐', items: ['土豆排骨', '鱼香肉丝', '黄瓜木耳肉片', '糖醋莲白', '西红柿蛋花汤', '番茄牛腩'] },
        { line: '2035贯通窗口', items: ['卤排骨盖浇饭+青椒土豆丝'] },
        { line: '主食', items: ['南瓜饭'] },
        { line: '素菜', items: ['蒜蓉生菜'] },
        { line: '特色小炒', items: ['粉蒸肥肠', '香辣炒猪扒', '冒卤牛肉', '西红柿炒蛋', '奥尔良烤鸡腿'] },
        { line: '面食', items: ['笋子牛肉刀削面'] },
      ]},
      { meal: '晚餐', lines: [
        { line: '套餐', items: ['尖椒煸卤肘', '绍子蒸水蛋', '蒜台小炒肉', '香菇菜心', '酸菜粉丝汤'] },
        { line: '盖浇饭', items: ['五彩碎肉芽菜炒饭'] },
        { line: '主食', items: ['红苕饭'] },
        { line: '素菜', items: ['炝炒下锅耙'] },
        { line: '特色小炒', items: ['尖椒绍子蒸茄子', '热拌鸡', '干锅排骨虾', '孜然肉片', '脆皮鸡腿'] },
      ]},
      { meal: '夜宵', lines: [
        { line: '夜宵', items: ['酸菜肉丝', '蛋炒饭', '茄汁薯条', '面包', '肉松面包'] },
      ]},
    ]},
    { day: '星期日', date: '2026-05-31', meals: [
      { meal: '晚餐', lines: [
        { line: '套餐', items: ['土豆排骨盖浇饭'] },
        { line: '小吃/汤', items: ['红油水饺', '南瓜汤'] },
      ]},
      { meal: '夜宵', lines: [
        { line: '夜宵', items: ['酸汤肉丝河粉', '香辣翅根', '折耳根狼牙土豆', '卤鸡腿', '肉松三明治'] },
      ]},
    ]},
  ],
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
  weeklyMenu,
  remindSettingsStore,
};
