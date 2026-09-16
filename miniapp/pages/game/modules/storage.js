/**
 * 智慧膳系统-冒险 · 本地存储读写
 *
 * 说明：storage key 继续沿用早期的 hx- 前缀，**故意不改**——
 * 改了会让老用户已保存的主题、宝箱领取状态全部失效（默认值回落）。
 */

const KEY_THEME = 'hx-game-theme'
const KEY_CHEST_DATE = 'hx-chest-date'

const DEFAULT_THEME = 'cyber'

/** 装备 → 增益文案 */
const EQUIP_BUFF = {
  '蛋白剑': '+15% 蛋白质效率',
  '纤维盾': '+20% 纤维吸收',
  '碳水戒': '+10% 碳水利用率',
  '能量环': '+5 能量上限'
}

function readTheme() {
  return wx.getStorageSync(KEY_THEME) || DEFAULT_THEME
}

function writeTheme(theme) {
  wx.setStorageSync(KEY_THEME, theme)
}

function readChestDate() {
  return wx.getStorageSync(KEY_CHEST_DATE) || ''
}

function writeChestDate(key) {
  wx.setStorageSync(KEY_CHEST_DATE, key)
}

/** 由装备槽生成「今日装备」列表 */
function buildEquipList(slots) {
  return (slots || [])
    .filter(function (s) { return s.filled })
    .map(function (s) {
      return {
        icon: s.icon,
        label: s.label,
        buff: EQUIP_BUFF[s.label] || '+10% 全属性'
      }
    })
}

module.exports = {
  DEFAULT_THEME: DEFAULT_THEME,
  EQUIP_BUFF: EQUIP_BUFF,
  readTheme: readTheme,
  writeTheme: writeTheme,
  readChestDate: readChestDate,
  writeChestDate: writeChestDate,
  buildEquipList: buildEquipList
}
