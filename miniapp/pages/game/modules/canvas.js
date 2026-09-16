/**
 * 智慧膳系统-冒险 · Canvas 渲染
 *
 * 三个画布都是「取节点 → 按主题色绘制」的模式：
 *   renderParticles  背景粒子（浅色主题下不渲染）
 *   renderMap        山体轮廓 + 雪顶 + 旗子
 *   renderTrend      本周营养趋势折线图
 *
 * 约定：页面把窗口信息放在 page._winInfo（见 util.getWindowInfo），
 * 这里只读不写；画布节点缓存挂在 page._particleCanvas / page._mapCanvas。
 */

const { THEMES } = require('./theme.js')

/** 背景粒子 */
function renderParticles(page) {
  const theme = THEMES[page.data.currentTheme]

  // 浅色主题不渲染粒子，背景纯色
  if (theme && theme.light) {
    const query = wx.createSelectorQuery()
    query.select('#particles').fields({ node: true, size: true }).exec(function (res) {
      if (!res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = page._winInfo.pixelRatio
      canvas.width = page._winInfo.windowWidth * dpr
      canvas.height = page._winInfo.windowHeight * dpr
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    })
    return
  }

  const sys = page._winInfo
  const query = wx.createSelectorQuery()
  query.select('#particles').fields({ node: true, size: true }).exec(function (res) {
    // 画布节点取不到时直接返回，避免 getContext 报错
    if (!res[0] || !res[0].node) return
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

    page._particleCanvas = canvas

    const draw = function () {
      ctx.clearRect(0, 0, w, h)
      const t = THEMES[page.data.currentTheme]
      const isLight = t && t.light
      const rgb = t ? t.particleRGB : [0, 229, 255]
      const pr = rgb[0], pg = rgb[1], pb = rgb[2]
      particles.forEach(function (p) {
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
}

/** 山体地图背景 */
function renderMap(page) {
  const sys = page._winInfo
  const query = wx.createSelectorQuery()
  query.select('#mapCanvas').fields({ node: true, size: true }).exec(function (res) {
    // 画布节点取不到时直接返回，避免 getContext 报错
    if (!res[0] || !res[0].node) return
    const canvas = res[0].node
    const ctx = canvas.getContext('2d')
    const dpr = sys.pixelRatio

    const mapW = res[0].width || (sys.windowWidth - 32)
    const mapH = res[0].height || mapW * 1.2
    canvas.width = mapW * dpr
    canvas.height = mapH * dpr
    ctx.scale(dpr, dpr)

    const theme = THEMES[page.data.currentTheme]
    const isLight = theme && theme.light
    const rgb = theme ? theme.particleRGB : [0, 229, 255]
    const mr = rgb[0], mg = rgb[1], mb = rgb[2]

    // 山体轮廓
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

    // 雪顶（仅深色主题）
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

    page._mapCanvas = canvas
  })
}

/** 本周营养趋势折线图 */
function renderTrend(page) {
  const data = page.data.weekTrend
  if (!data || !data.length) return
  const query = wx.createSelectorQuery()
  query.select('#trendCanvas').fields({ node: true, size: true }).exec(function (res) {
    if (!res[0] || !res[0].node) return
    const canvas = res[0].node
    const ctx = canvas.getContext('2d')
    const dpr = page._winInfo.pixelRatio
    const w = res[0].width || 700
    const h = res[0].height || 320
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    const theme = THEMES[page.data.currentTheme]
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
    data.forEach(function (d, i) {
      const x = pad.left + (pw / (data.length - 1)) * i
      ctx.fillText(d.day, x, h - 6)
    })

    // 折线 + 数据点
    lines.forEach(function (line) {
      ctx.beginPath()
      ctx.strokeStyle = line.color
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      data.forEach(function (d, i) {
        const val = d[line.key] || 0
        const x = pad.left + (pw / (data.length - 1)) * i
        const y = pad.top + ph - (val / maxVals[line.key]) * ph
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      data.forEach(function (d, i) {
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

module.exports = {
  renderParticles: renderParticles,
  renderMap: renderMap,
  renderTrend: renderTrend
}
