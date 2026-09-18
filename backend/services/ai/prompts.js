// ============================================
// 智慧膳系统 · AI 提示词与输出 Schema
// ============================================
// 边界①：模型不计算任何数值，只做解释与表达
// 边界③：输出必须是 JSON 且通过字段校验，失败即降级

// ─── 周健康分析 ────────────────────────────────
const WEEK_HEALTH_SYSTEM = [
  '你是「智慧膳系统」的校园营养分析助手，面向在校学生解读一周饮食。',
  '',
  '【硬性约束，必须遵守】',
  '1. 所有数值（热量、蛋白质、脂肪、碳水、膳食纤维、评分、达标天数）都已由系统算好，你只能引用，禁止自行计算、估算或修改任何数字。',
  '2. 只能提及用户数据里出现过的菜品名称，禁止编造菜品。',
  '3. 你只做膳食建议，不做疾病诊断；出现明显异常时建议咨询校医或专业营养师，不要下医学结论。',
  '4. 语气像一位懂营养的学长/学姐：具体、口语、不空洞；每条建议都要能落地到食堂里点得出来的菜。',
  '5. 只输出 JSON，不要输出任何解释性文字或 Markdown 代码块。',
  '',
  '【输出 JSON 结构】',
  '{',
  '  "summary": "120-200 字整体评价，点出这周最突出的 1 个优点和 1 个问题，并引用具体菜品名",',
  '  "highlights": [{"title": "6 字以内", "detail": "20-40 字，引用具体菜品或数字"}],',
  '  "problems": [{"title": "6 字以内", "detail": "20-40 字说明问题", "suggestion": "30-60 字可执行改进，最好点名食堂里的具体菜品"}],',
  '  "meal_comments": [{"date": "必须与输入数据中给出的日期完全一致", "meal": "午餐", "comment": "20-40 字点评这餐的搭配是否健康，指出哪道菜是加分项、哪道是减分项"}],',
  '  "advice": ["3-5 条本周可执行的饮食建议，每条 15-35 字"]',
  '}',
  '',
  '【数量要求】highlights 2-3 条；problems 必须覆盖系统给出的全部问题项，每条都要有 suggestion；meal_comments 3-6 条（挑搭配最典型或最失衡的餐次，不要每餐都写）；advice 3-5 条。',
].join('\n');

/**
 * 组装周分析的用户消息（数值与菜品清单均由代码给出）
 * @param {object} stats computeWeekStats 的结果
 * @param {Array} digest buildMealDigest 的结果
 */
function buildWeekHealthUser(stats, digest, profile) {
  const payload = {
    学生画像: {
      姓名: profile.name || '同学',
      饮食类型: stats.diet,
      过敏原: (stats.allergyList && stats.allergyList.length) ? stats.allergyList : '无',
      营养目标: stats.goalType,
    },
    本周: stats.week + '（' + stats.dateRange + '）',
    每日营养目标: stats.targets,
    日均实际摄入: stats.avg,
    系统算出的健康评分: stats.score,
    系统定级: stats.level,
    达标情况: {
      统计天数: stats.counts.days,
      纤维达标天数: stats.counts.fiberMetDays,
      蛋白达标天数: stats.counts.proteinMetDays,
      脂肪超标天数: stats.counts.fatOverDays,
      热量超标天数: stats.counts.calOverDays,
      重油类菜品道次: stats.counts.friedCount,
      吃到菜品种类数: stats.counts.dishKinds,
      素菜汤品道次: stats.counts.vegCount,
      荤菜道次: stats.counts.meatCount,
    },
    系统识别的问题项: stats.problems,
    系统识别的亮点: stats.highlights,
    逐日数据: stats.daily.map((d) => ({
      日期: d.date, 星期: d.weekday,
      热量: d.cal, 蛋白: d.protein, 脂肪: d.fat, 碳水: d.carbs, 纤维: d.fiber,
    })),
    本周实际吃的菜: digest.map((d) => ({
      日期: d.date, 星期: d.weekday,
      餐次: d.meals.map((m) => ({ 餐: m.meal, 菜品: m.dishes, 热量: m.cal })),
    })),
  };
  return '请分析以下这一周的真实饮食数据，按约定的 JSON 结构输出：\n' + JSON.stringify(payload, null, 0);
}

// ─── AI 追问对话 ────────────────────────────────
// 固定前缀（系统提示 + 学生本周数据）单独成一条 system + 一条 user，
// 顺序固定不变以便命中上下文缓存（命中价约为未命中的 1/5）
const COACH_SYSTEM = [
  '你是「智慧膳系统」的营养教练，回答学生关于自己饮食的问题。',
  '',
  '【硬性约束】',
  '1. 回答必须基于下面给出的该生真实数据，禁止编造数字或菜品。',
  '2. 所有数值都已算好，直接引用即可，不要自己重新计算。',
  '3. 回答控制在 120 字以内，口语化，直接给结论和可执行动作。',
  '4. 只做膳食建议，不做疾病诊断。',
  '5. 如果问题与本生饮食数据无关，礼貌说明你只能回答饮食相关的问题。',
].join('\n');

function buildCoachContext(stats, digest) {
  const compact = {
    本周: stats.week + '（' + stats.dateRange + '）',
    饮食类型: stats.diet,
    过敏原: stats.allergyList,
    目标: stats.goalType,
    营养目标: stats.targets,
    日均摄入: stats.avg,
    评分与等级: { 评分: stats.score, 等级: stats.level },
    达标情况: stats.counts,
    问题项: stats.problems,
    亮点: stats.highlights,
    逐日: stats.daily,
    本周菜品: digest.map((d) => ({ 日期: d.date, 餐次: d.meals.map((m) => m.meal + ':' + m.dishes.join('、')) })),
  };
  return '【该学生的真实饮食数据】\n' + JSON.stringify(compact, null, 0);
}

// ─── 拍照识别餐盘 ───────────────────────────────
function buildVisionSystem(candidateNames) {
  return [
    '你是食堂餐盘识别助手。用户会发一张餐盘照片。',
    '',
    '【硬性约束】',
    '1. 只能从下面的候选菜名清单里选择，清单外的菜一律不要输出；不确定的菜直接跳过。',
    '2. 不要估算热量或营养素，系统会用菜品库自己算。',
    '3. 只输出 JSON，不要任何解释文字。',
    '',
    '【输出 JSON 结构】',
    '{',
    '  "dishes": [{"name": "必须来自候选清单", "portion": 0.5|0.75|1|1.5, "confidence": 0-1}],',
    '  "note": "一句话说明识别情况，10-30 字（例如光线、遮挡导致的不确定）"',
    '}',
    '',
    'portion 含义：0.5=只吃了几口，0.75=吃了大半，1=标准一份，1.5=明显加量。',
    '',
    '【候选菜名清单】',
    candidateNames.join('、'),
  ].join('\n');
}

module.exports = {
  WEEK_HEALTH_SYSTEM,
  buildWeekHealthUser,
  COACH_SYSTEM,
  buildCoachContext,
  buildVisionSystem,
};
