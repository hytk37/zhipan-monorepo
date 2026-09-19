// utils/util.js
// 通用工具函数

/**
 * 格式化日期
 */
function formatDate(date, format) {
  if (!(date instanceof Date)) date = new Date(date);
  const o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  };
  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
    }
  }
  return format;
}

/**
 * 计算 BMI
 */
function calcBMI(weight, height) {
  if (!weight || !height || height <= 0) return 0;
  return (weight / ((height / 100) * (height / 100))).toFixed(1);
}

/**
 * BMI 等级
 */
function bmiLevel(bmi) {
  bmi = parseFloat(bmi);
  if (bmi < 18.5) return { label: '偏瘦', color: '#007AFF' };
  if (bmi < 24) return { label: '正常', color: '#07C160' };
  if (bmi < 28) return { label: '偏胖', color: '#FF9500' };
  return { label: '肥胖', color: '#FF3B30' };
}

/**
 * 营养评分颜色
 */
function scoreColor(score) {
  if (score >= 80) return '#07C160';
  if (score >= 60) return '#FF9500';
  return '#FF3B30';
}

/**
 * 营养素达标状态
 */
function nutrientStatus(current, target) {
  const pct = Math.round((current / target) * 100);
  if (pct >= 100) return { type: 'ok', label: '达标', pct: 100 };
  if (pct >= 70) return { type: 'low', label: '偏低', pct };
  return { type: 'low', label: '不足', pct };
}

/**
 * 节流函数
 */
function throttle(fn, delay) {
  let last = 0;
  return function () {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, arguments);
    }
  };
}

module.exports = {
  formatDate,
  calcBMI,
  bmiLevel,
  scoreColor,
  nutrientStatus,
  throttle
};
