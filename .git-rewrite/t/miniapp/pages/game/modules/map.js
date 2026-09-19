/**
 * 智慧膳系统-冒险 · 冒险地图节点计算
 *
 * 纯计算模块：输入「今天星期几」，输出节点、连线、玩家位置，
 * 不直接碰页面，方便单独验证。
 *
 * 布局说明：登山攀登式 Z 形路径，节点全部约束在山体多边形内部，左右交替。
 */

const NODE_SIZE_RPX = 104

/** 关卡节点模板（origX / origY 为 rpx 坐标） */
const RAW_NODES = [
  { origX: 150, origY: 720, day: '周一', stars: 3, cleared: true,  current: false, isBoss: false },
  { origX: 500, origY: 635, day: '周二', stars: 2, cleared: true,  current: false, isBoss: false },
  { origX: 200, origY: 550, day: '周三', stars: 3, cleared: true,  current: false, isBoss: false },
  { origX: 410, origY: 465, day: '周四', stars: 0, cleared: false, current: false, isBoss: false },
  { origX: 285, origY: 380, day: '周五', stars: 0, cleared: false, current: false, isBoss: false },
  { origX: 345, origY: 295, day: '周六', stars: 0, cleared: false, current: false, isBoss: false },
  { origX: 335, origY: 210, day: '周日', stars: 0, cleared: false, current: false, isBoss: false },
  { origX: 375, origY: 120, day: '奖励', stars: 0, cleared: false, current: false, isBoss: true  }
]

/** 真实星期对齐：周一=0 ~ 周日=6 */
function currentDayIndex(date) {
  const d = date || new Date()
  const realDay = d.getDay() // 0=周日, 1=周一 ... 6=周六
  return realDay === 0 ? 6 : realDay - 1
}

/**
 * 生成地图数据。
 * @param {Date} date 用于判断「今天是周几」
 * @returns {{mapNodes: Array, mapLines: Array, playerLeft: string, playerTop: string}}
 */
function buildNodes(date) {
  const dayIndex = currentDayIndex(date)
  const halfNode = NODE_SIZE_RPX / 2

  // 深拷贝一层，避免修改模块级模板
  const rawNodes = RAW_NODES.map(function (n) {
    return Object.assign({}, n)
  })

  // 当天及之前已通关，当天为 current，之后为 locked
  for (let i = 0; i < 7; i++) {
    if (i < dayIndex) {
      rawNodes[i].cleared = true
      rawNodes[i].current = false
    } else if (i === dayIndex) {
      rawNodes[i].cleared = false
      rawNodes[i].current = true
    } else {
      rawNodes[i].cleared = false
      rawNodes[i].current = false
    }
  }

  // 坐标已是 rpx，直接使用
  const mapNodes = rawNodes.map(function (n) {
    const xRpx = Math.round(n.origX - halfNode)
    const yRpx = Math.round(n.origY - halfNode)
    const cls = n.current ? 'current' : n.cleared ? 'cleared' : 'locked'
    const starsText = n.cleared ? '⭐'.repeat(n.stars) : (n.current ? '🏃' : '🔒')
    const dayLabel = n.isBoss ? '👑' : n.day
    return Object.assign({}, n, {
      styleLeft: xRpx + 'rpx',
      styleTop: yRpx + 'rpx',
      cls: cls,
      starsText: starsText,
      dayLabel: dayLabel
    })
  })

  // 生成节点间连线（带 id 供 wx:key 使用）
  const mapLines = []
  for (let i = 0; i < rawNodes.length - 1; i++) {
    const a = rawNodes[i]
    const b = rawNodes[i + 1]
    const dx = b.origX - a.origX
    const dy = b.origY - a.origY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    mapLines.push({
      id: 'line-' + i,
      left: Math.round(a.origX) + 'rpx',
      top: Math.round(a.origY) + 'rpx',
      width: Math.round(dist) + 'rpx',
      angle: angle.toFixed(2) + 'deg',
      cleared: a.cleared && b.cleared
    })
  }

  const current = rawNodes.find(function (n) { return n.current }) || rawNodes[0]

  return {
    mapNodes: mapNodes,
    mapLines: mapLines,
    playerLeft: Math.round(current.origX - 32) + 'rpx',
    playerTop: Math.round(current.origY - 128) + 'rpx'
  }
}

/** 计算并写入页面 */
function render(page) {
  page.setData(buildNodes(new Date()))
}

module.exports = {
  NODE_SIZE_RPX: NODE_SIZE_RPX,
  currentDayIndex: currentDayIndex,
  buildNodes: buildNodes,
  render: render
}
