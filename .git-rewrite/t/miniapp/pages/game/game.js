/**
 * 智慧膳系统-冒险 · 营养闯关 - 页面外壳
 *
 * 这里只保留「页面级」的东西：数据装配、生命周期、事件转发。
 * 具体逻辑按职责拆到 ./modules/：
 *
 *   initial-data.js  页面初始数据（全部静态数据集中在此）
 *   theme.js         主题样式构建与应用
 *   map.js           地图节点 / 连线 / 玩家位置计算
 *   canvas.js        粒子、山体、趋势折线三个画布渲染
 *   profile.js       目标预设与 BMI 计算
 *   storage.js       主题、宝箱状态的本地存储
 *   util.js          金币格式化、窗口信息等通用工具
 */

const DATA = require('./modules/initial-data.js')
const themeMod = require('./modules/theme.js')
const mapMod = require('./modules/map.js')
const canvasMod = require('./modules/canvas.js')
const profileMod = require('./modules/profile.js')
const storage = require('./modules/storage.js')
const util = require('./modules/util.js')

const THEMES = themeMod.THEMES

Page({
  data: DATA.buildInitialData(),

  // 内部变量（不参与渲染）
  _particleCanvas: null,   // 粒子画布节点
  _mapCanvas: null,        // 山体画布节点
  _coinRaw: 0,             // 金币原始数值，渲染时再格式化
  _themeApplied: '',       // 已应用的主题，避免重复 setData
  _winInfo: null,          // 窗口信息（wx.getWindowInfo 结果）

  onLoad() {
    // 从主程序获取学生信息和营养数据
    const studentInfo = wx.getStorageSync('studentInfo') || {}
    const nutrition = wx.getStorageSync('todayNutrition') || {}

    // 窗口信息，用于响应式尺寸（原 wx.getSystemInfoSync 已弃用）
    this._winInfo = util.getWindowInfo()

    const statusBarHeight = this._winInfo.statusBarHeight || 20
    const navBarHeight = statusBarHeight + 48 // 导航栏内容区 48px（触摸友好）

    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      // 从主程序同步用户信息
      profileName: studentInfo.name || '冒险者',
      profileCollege: studentInfo.college || '',
      profileId: studentInfo.id || '',
      level: studentInfo.level || 5,
      // 从主程序同步营养数据到游戏属性
      'stats[0].current': nutrition.calories || 1680,
      'stats[0].max': nutrition.caloriesTarget || 2200,
      'stats[1].current': nutrition.protein || 68,
      'stats[1].max': nutrition.proteinTarget || 75,
      'stats[2].current': nutrition.carbs || 210,
      'stats[2].max': nutrition.carbsTarget || 280,
      'stats[3].current': nutrition.fiber || 18,
      'stats[3].max': nutrition.fiberTarget || 25
    })

    // 恢复保存的主题
    const savedTheme = storage.readTheme()
    this.setData({ currentTheme: savedTheme })
    this._applyTheme(savedTheme)

    // 恢复宝箱状态（跨会话持久化）
    if (storage.readChestDate() === util.todayKey()) {
      this.setData({
        chestOpened: true,
        chestLabel: '🎉 获得 50 💰！明日再来'
      })
    }

    this._loadTodayEquip()
    this._initMapNodes()
  },

  onReady() {
    this._initParticles()
    this._initMap()
    setTimeout(() => this._initTrendChart(), 300)
  },

  // 页面隐藏/卸载时停掉粒子 rAF 循环，释放主线程（避免后台空转拖慢整机）
  onHide() {
    canvasMod.stopParticles(this)
  },

  onUnload() {
    canvasMod.stopParticles(this)
  },

  // ===== 主题 =====
  _buildThemeStyle(themeKey) {
    return themeMod.buildStyle(themeKey)
  },

  _applyTheme(theme) {
    themeMod.apply(this, theme)
  },

  toggleThemePanel() {
    this.setData({ showThemePanel: !this.data.showThemePanel })
  },

  setTheme(e) {
    const t = e.currentTarget.dataset.t
    if (!THEMES[t]) return
    this.setData({ currentTheme: t, showThemePanel: false })
    storage.writeTheme(t)
    this._themeApplied = '' // 强制刷新
    this._applyTheme(t)
    this._showToast('🎨 主题已切换：' + THEMES[t].name)

    // 重绘地图（主题色变更）
    setTimeout(() => this._initMap(), 100)
    // 重新初始化粒子（浅色↔深色切换需要启停粒子）
    setTimeout(() => this._initParticles(), 100)
  },

  // ===== Tab 切换 =====
  switchTab(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ currentTab: idx })
    if (idx === 0) {
      setTimeout(() => {
        this._initMapNodes()
        this._initMap()
      }, 100)
    }
    if (idx === 1) {
      setTimeout(() => this._initTrendChart(), 200)
    }
  },

  // ===== 返回主程序 =====
  goBack() {
    wx.navigateBack({ delta: 1 })
  },

  // ===== 任务勾选 =====
  toggleQuest(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const quests = this.data.quests
    const q = quests[idx]
    // 已完成任务不可取消勾选
    if (q.done) {
      this._showToast('该任务已完成，无法取消')
      return
    }
    // 首次完成时标记并奖励
    if (!q.rewarded) {
      q.done = true
      q.rewarded = true
      // 从 reward 字符串提取金币数量，如 "+30 💰 · +15 EXP" → 30
      const match = q.reward.match(/\+(\d+)\s*💰/)
      const gold = match ? parseInt(match[1], 10) : 10
      this._coinRaw += gold
      this._showToast('✅ 任务完成！获得 +' + gold + ' 💰')
      this.setData({
        quests: quests.slice(),
        coins: util.formatGold(this._coinRaw)
      })
    }
  },

  // ===== 金币格式化（替代不稳定的 toLocaleString） =====
  _formatGold(n) {
    return util.formatGold(n)
  },

  // ===== 宝箱 =====
  openChest() {
    // 每日只能领一次：用日期 key 持久化到 storage
    const todayKey = util.todayKey()
    if (storage.readChestDate() === todayKey) {
      this._showToast('今日宝箱已开启，明天再来！')
      return
    }
    this._coinRaw += 50
    storage.writeChestDate(todayKey)
    this.setData({
      chestOpened: true,
      coins: util.formatGold(this._coinRaw),
      chestLabel: '🎉 获得 50 💰！明日再来'
    })
    this._showToast('🎁 宝箱开启！获得 50 金币')
  },

  // ===== 今日装备列表 =====
  _loadTodayEquip() {
    const list = storage.buildEquipList(this.data.equipSlots)
    this.setData({ todayEquipList: list, todayEquipCount: list.length })
  },

  // ===== 地图节点 =====
  _initMapNodes() {
    mapMod.render(this)
  },

  onMapNodeTap(e) {
    const idx = Number(e.currentTarget.dataset.index)
    const node = this.data.mapNodes[idx]
    if (!node) return
    if (node.cleared) {
      this._showToast(node.day + '已通关！⭐×' + node.stars)
    } else if (node.current) {
      this._showToast(node.day + '正在进行中...')
    }
  },

  // ===== 菜品详情 =====
  showFoodDetail(e) {
    const food = e.currentTarget.dataset.food
    this.setData({
      currentModal: 'food',
      foodDetail: food
    })
  },

  addFood() {
    this.setData({ currentModal: '' })
    this._showToast('⚔️ 补给已装备！')
    // 刷新今日装备列表
    this._loadTodayEquip()
  },

  // ===== 模态框 =====
  showModal(e) {
    const type = e.currentTarget.dataset.type
    if (!type) return
    this.setData({ currentModal: type, showThemePanel: false })
  },

  closeModal() {
    this.setData({ currentModal: '' })
  },

  closeModalBg(e) {
    if (e.target === e.currentTarget) {
      this.setData({ currentModal: '' })
    }
  },

  // ===== 属性/状态详情弹窗 =====
  onAttrTap(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.attrs[idx]
    if (!item) return
    this.setData({
      currentModal: 'detail',
      detailInfo: { icon: item.icon, title: item.name, content: item.detail }
    })
  },

  onBuffTap(e) {
    const idx = e.currentTarget.dataset.idx
    const item = this.data.buffs[idx]
    if (!item) return
    const first = item.text.charAt(0)
    const icon = first === '🛡' ? '🛡️' : first === '⚡' ? '⚡' : first === '⚠' ? '⚠️' : '🧊'
    this.setData({
      currentModal: 'detail',
      detailInfo: {
        icon: icon,
        title: item.text.replace(/^[🛡️⚡⚠️🧊]\s*/, ''),
        content: item.detail
      }
    })
  },

  // ===== 表单交互 =====
  onInputName(e) { this.setData({ profileName: e.detail.value }) },
  onInputId(e) { this.setData({ profileId: e.detail.value }) },
  onInputCollege(e) { this.setData({ profileCollege: e.detail.value }) },
  onInputAge(e) { this.setData({ profileAge: e.detail.value }) },

  setGender(e) {
    this.setData({ profileGender: e.currentTarget.dataset.val })
  },

  setGoal(e) {
    profileMod.applyGoal(this, e.currentTarget.dataset.type)
  },

  onInputGoalCal(e) { this.setData({ goalCal: Number(e.detail.value) }) },
  onInputGoalPro(e) { this.setData({ goalPro: Number(e.detail.value) }) },
  onInputGoalCarb(e) { this.setData({ goalCarb: Number(e.detail.value) }) },
  onInputGoalFat(e) { this.setData({ goalFat: Number(e.detail.value) }) },
  onInputGoalFib(e) { this.setData({ goalFib: Number(e.detail.value) }) },

  toggleAllergy(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const list = this.data.allergyList
    if (!list[idx]) return
    list[idx].selected = !list[idx].selected
    this.setData({ allergyList: list })
  },

  onInputHeight(e) {
    this.setData({ bodyHeight: Number(e.detail.value) }, () => this._calcBMI())
  },

  onInputWeight(e) {
    this.setData({ bodyWeight: Number(e.detail.value) }, () => this._calcBMI())
  },

  _calcBMI() {
    const r = profileMod.calcBmi(this.data.bodyHeight, this.data.bodyWeight)
    if (r) this.setData(r)
  },

  toggleReminder(e) {
    const key = e.currentTarget.dataset.key
    const reminders = this.data.reminders
    reminders[key] = !reminders[key]
    this.setData({ reminders: reminders })
  },

  // ===== 保存操作 =====
  saveProfile() {
    this.setData({ currentModal: '' })
    this._showToast('角色信息已保存')
  },
  saveGoal() {
    this.setData({ currentModal: '' })
    this._showToast('战斗目标已更新')
  },
  saveAllergy() {
    this.setData({ currentModal: '' })
    this._showToast('弱点防御已更新')
  },
  saveBody() {
    this.setData({ currentModal: '' })
    this._showToast('体质数据已保存')
  },
  saveReminders() {
    this.setData({ currentModal: '' })
    this._showToast('提醒设置已保存')
  },

  // ===== Toast =====
  _showToast(msg) {
    this.setData({ toastMsg: msg, showToast: true })
    setTimeout(() => {
      this.setData({ showToast: false })
    }, 2000)
  },

  // ===== 辅助 =====
  _hexToRgb(hex) {
    return util.hexToRgb(hex)
  },

  // ===== 画布 =====
  _initParticles() {
    canvasMod.renderParticles(this)
  },

  _initMap() {
    canvasMod.renderMap(this)
  },

  _initTrendChart() {
    canvasMod.renderTrend(this)
  }
})
