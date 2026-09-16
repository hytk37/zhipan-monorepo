/**
 * 智慧膳系统-冒险 · 档案与体质
 * 目标预设、BMI 计算等纯逻辑。
 */

/** 四档目标预设 */
const GOALS = {
  cut:     { cal: 1800, pro: 90,  carb: 200, fat: 50, fib: 25 },
  healthy: { cal: 2200, pro: 75,  carb: 280, fat: 65, fib: 25 },
  bulk:    { cal: 2500, pro: 95,  carb: 320, fat: 70, fib: 25 },
  muscle:  { cal: 2800, pro: 120, carb: 350, fat: 80, fib: 25 }
}

/**
 * 切换战斗目标并写入页面。
 * @returns {boolean} 目标类型非法时返回 false
 */
function applyGoal(page, type) {
  const g = GOALS[type]
  if (!g) return false
  page.setData({
    goalType: type,
    goalCal: g.cal,
    goalPro: g.pro,
    goalCarb: g.carb,
    goalFat: g.fat,
    goalFib: g.fib
  })
  return true
}

/**
 * 计算 BMI 及展示所需字段。
 *
 * 注意：判断顺序必须是「先 ≥28 再 ≥24」——原实现把 ≥24 写在前面，
 * 导致「肥胖」分支永远进不去，这里已修正。
 *
 * @returns {object|null} 身高体重非法时返回 null
 */
function calcBmi(height, weight) {
  if (!height || !weight || height <= 0 || weight <= 0) return null
  const bmi = (weight / ((height / 100) * (height / 100))).toFixed(1)
  const bv = parseFloat(bmi)

  let status = '正常'
  let color = '#69f0ae'
  if (bv < 18.5) { status = '偏瘦'; color = '#448aff' }
  else if (bv >= 28) { status = '肥胖'; color = '#ff5252' }
  else if (bv >= 24) { status = '偏胖'; color = '#ffd740' }

  const pct = bv < 15 ? 0 : bv > 35 ? 100 : Math.round((bv - 15) / 20 * 100)

  return {
    bmiVal: bmi,
    bmiStatus: status,
    bmiColor: color,
    bmiPct: pct,
    // style 字符串在这里拼好，避免 WXML 里出现 "{{x}}%" 触发样式校验
    bmiPointerStyle: 'left:' + pct + '%'
  }
}

module.exports = {
  GOALS: GOALS,
  applyGoal: applyGoal,
  calcBmi: calcBmi
}
