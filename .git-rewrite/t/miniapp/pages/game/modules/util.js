/**
 * 智慧膳系统-冒险 · 通用工具
 * 纯函数，无任何 wx API 依赖，便于单独测试。
 */

/** 金币格式化（不用 toLocaleString，避免不同基础库表现不一致） */
function formatGold(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0'
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** #RRGGBB → "r,g,b"，供 Canvas 拼 rgba() 使用 */
function hexToRgb(hex) {
  hex = String(hex || '').replace('#', '')
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return r + ',' + g + ',' + b
}

/** 当天日期 key，用于「每日一次」类逻辑（宝箱等） */
function todayKey(date) {
  const d = date || new Date()
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}

/**
 * 取窗口信息。
 * wx.getSystemInfoSync 已弃用（控制台会告警），优先用 wx.getWindowInfo；
 * 低版本基础库没有该 API 时回退，保证兼容。
 */
function getWindowInfo() {
  if (typeof wx.getWindowInfo === 'function') {
    try {
      return wx.getWindowInfo()
    } catch (e) {
      // 少数环境异常时继续走下面的兜底
    }
  }
  return wx.getSystemInfoSync()
}

module.exports = {
  formatGold: formatGold,
  hexToRgb: hexToRgb,
  todayKey: todayKey,
  getWindowInfo: getWindowInfo
}
