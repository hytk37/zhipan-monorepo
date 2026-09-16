/**
 * 智慧膳系统-冒险 · 主题
 * 主题定义本身放在 utils/game-theme.js（与小程序其它页面共用），
 * 这里只负责「把主题转成 inline CSS 变量」和「应用到页面」。
 */

const { THEMES, THEME_DOTS } = require('../../../utils/game-theme.js')

/**
 * 将主题的全部 CSS 变量打包成 inline style 字符串。
 * 直接更新 .app 元素的 style，切换主题时无需依赖属性选择器。
 */
function buildStyle(themeKey) {
  const t = THEMES[themeKey]
  if (!t) return ''
  const v = t.vars
  let s = ''
  for (const key in v) {
    s += key + ':' + v[key] + ';'
  }
  return s
}

/** 把主题应用到页面（CSS 变量 + 原生导航栏颜色） */
function apply(page, theme) {
  if (page._themeApplied === theme) return
  page._themeApplied = theme
  const t = THEMES[theme]
  if (!t) return

  page.setData({
    themeStyle: buildStyle(theme)
  })

  wx.setNavigationBarColor({
    frontColor: t.light ? '#000000' : '#ffffff',
    backgroundColor: t.vars['--bg1'],
    animation: { duration: 300, timingFunc: 'easeIn' }
  })
}

module.exports = {
  THEMES: THEMES,
  THEME_DOTS: THEME_DOTS,
  buildStyle: buildStyle,
  apply: apply
}
