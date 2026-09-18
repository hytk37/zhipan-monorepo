// ============================================
// 智慧膳系统 · 本周饮食健康分析（AI 交互页）
// ============================================
// 数值来自后端确定性计算，AI 只负责解释与建议；
// 未配置 Key 时后端会自动降级为规则模板，页面同样有内容。

const app = getApp();
const api = require('../../utils/api');

// 等级 → 样式类
const LEVEL_CLASS = {
  优秀: 'lv-excellent',
  良好: 'lv-good',
  一般: 'lv-normal',
  需改善: 'lv-warn',
};

function clampPct(v) {
  if (!v && v !== 0) return 0;
  return Math.max(3, Math.min(100, Math.round(v)));
}

Page({
  data: {
    loading: true,
    error: '',
    studentId: null,
    student: {},
    week: '',
    dateRange: '',
    score: 0,
    level: '',
    levelClass: 'lv-normal',
    scoreRing: '',
    source: '',
    sourceLabel: '',
    summary: '',
    aiHighlights: [],
    aiProblems: [],
    mealComments: [],
    advice: [],
    avg: {},
    targets: {},
    counts: {},
    daily: [],
    disclaimer: '',
    messages: [],
    input: '',
    sending: false,
    scrollTo: '',
    refreshing: false,
    syncText: '',
    usageText: ''
  },

  onLoad() {
    const studentId = (app.globalData && app.globalData.currentStudentId) || wx.getStorageSync('studentId') || 0;
    this.setData({ studentId: studentId });
    this.load(false);
  },

  onPullDownRefresh() {
    this.load(true).then(() => wx.stopPullDownRefresh());
  },

  // ─── 加载：周记录 + AI 分析 ───────────────────
  load(refresh) {
    const id = this.data.studentId;
    this.setData({ loading: !refresh, refreshing: !!refresh, error: '' });
    return Promise.all([
      api.ai.getWeekMeals(id),
      api.ai.getWeekHealth(id, refresh)
    ]).then((res) => {
      const weekRes = res[0] || {};
      const a = res[1] || {};
      this.renderAnalysis(a, weekRes.stats);
    }).catch((e) => {
      this.setData({
        loading: false,
        refreshing: false,
        error: '加载失败，请确认后端服务已启动（' + ((e && e.statusCode) || '网络异常') + '）'
      });
    });
  },

  renderAnalysis(a, stats) {
    const statsData = stats || {};
    const daily = (a.daily || statsData.daily || []).map((d) => ({
      date: d.date,
      weekday: d.weekday,
      cal: d.cal,
      fiber: d.fiber,
      fat: d.fat,
      calW: this.barStyle(d.calPct, '#FF9500'),
      proteinW: this.barStyle(d.proteinPct, '#FF6B35'),
      fatW: this.barStyle(d.fatPct, '#007AFF'),
      fiberW: this.barStyle(d.fiberPct, '#07C160')
    }));

    const st = a.student || {};
    const id = this.data.studentId;
    const score = a.score || 0;
    const source = a.source || 'fallback';
    // 展示用：均值取整，避免「100.7」这类小数在窄列里挤行
    const rawAvg = a.avg || {};
    const avg = {
      cal: Math.round(rawAvg.cal || 0),
      protein: Math.round(rawAvg.protein || 0),
      fat: Math.round(rawAvg.fat || 0),
      carbs: Math.round(rawAvg.carbs || 0),
      fiber: Math.round(rawAvg.fiber || 0)
    };

    this.setData({
      loading: false,
      refreshing: false,
      student: st,
      week: a.week || '',
      dateRange: a.dateRange || '',
      score: score,
      level: a.level || '',
      levelClass: LEVEL_CLASS[a.level] || 'lv-normal',
      scoreRing: this.ringStyle(score),
      source: source,
      sourceLabel: source === 'ai' ? 'DeepSeek 生成' : '规则模板（未配置 API Key）',
      summary: (a.analysis && a.analysis.summary) || '',
      aiHighlights: (a.analysis && a.analysis.highlights) || [],
      aiProblems: (a.analysis && a.analysis.problems) || [],
      mealComments: (a.analysis && a.analysis.mealComments) || [],
      advice: (a.analysis && a.analysis.advice) || [],
      avg: avg,
      targets: a.targets || {},
      counts: a.counts || {},
      daily: daily,
      disclaimer: a.disclaimer || '',
      syncText: this.fmtTime(a.updatedAt),
      usageText: a.mockMode ? '当前为演示模式：未配置 DeepSeek API Key，分析由规则模板生成' : ''
    });

    wx.setNavigationBarTitle({ title: (st.name || '我') + ' · 本周饮食健康' });
  },

  // ISO 时间 → 今天 HH:MM（跨天显示 M月D日 HH:MM）
  fmtTime(iso) {
    const d = new Date(iso);
    if (!iso || isNaN(d.getTime())) return '';
    const now = new Date();
    const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    if (d.toDateString() === now.toDateString()) return '今天 ' + hm + ' 更新';
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hm + ' 更新';
  },

  // 评分环（用 style 字符串，规避 WXSS 对 % 的解析问题）
  ringStyle(score) {    const pct = clampPct(score);
    const color = score >= 85 ? '#07C160' : score >= 75 ? '#2F80ED' : score >= 60 ? '#FF9500' : '#FF3B30';
    return 'width:' + pct + '%;background:' + color;
  },

  barStyle(pct, color) {
    return 'width:' + clampPct(pct) + '%;background:' + color;
  },

  // ─── 重新生成（强制刷新，绕过缓存）────────────
  onRefresh() {
    if (this.data.refreshing) return;
    wx.showLoading({ title: 'AI 重新分析中' });
    this.load(true).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '已重新生成', icon: 'success' });
    }).catch(() => wx.hideLoading());
  },

  // ─── 追问对话 ─────────────────────────────────
  onInput(e) {
    this.setData({ input: e.detail.value });
  },

  onAskQuick(e) {
    const q = e.currentTarget.dataset.q;
    if (!q) return;
    this.setData({ input: q });
    this.onSend();
  },

  onSend() {
    const question = (this.data.input || '').trim();
    if (!question || this.data.sending) return;

    const history = this.data.messages.slice(-6).map((m) => ({ role: m.role, content: m.text }));
    const messages = this.data.messages.concat([{ role: 'user', text: question, id: 'u' + Date.now() }]);
    this.setData({ messages: messages, input: '', sending: true, scrollTo: 'msg-bottom' });

    api.ai.chat(this.data.studentId, question, history).then((r) => {
      const list = this.data.messages.concat([{
        role: 'assistant',
        text: (r && r.answer) || '暂时没能回答，请稍后再问一次。',
        tag: r && r.source === 'ai' ? 'AI' : '规则',
        id: 'a' + Date.now()
      }]);
      this.setData({ messages: list, sending: false, scrollTo: 'msg-bottom' });
    }).catch(() => {
      const list = this.data.messages.concat([{
        role: 'assistant',
        text: '网络异常，暂时回答不了。可以检查后端服务是否启动。',
        tag: '提示',
        id: 'e' + Date.now()
      }]);
      this.setData({ messages: list, sending: false, scrollTo: 'msg-bottom' });
    });
  },

  // ─── 拍照记一餐（识别结果直接写入本周记录）────
  onPhotoMeal() {
    if (this.data.sending) return;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['camera', 'album'],
      success: (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file) return;
        wx.showLoading({ title: '正在识别餐盘' });
        this.uploadForRecognize(file.tempFilePath);
      },
      fail: () => {}
    });
  },

  uploadForRecognize(filePath) {
    const fs = wx.getFileSystemManager();
    // 先压缩到 512px 以内，控制 base64 体积（后端限制 900KB）
    const compress = (src) => new Promise((resolve) => {
      if (typeof wx.compressImage !== 'function') return resolve(src);
      wx.compressImage({ src: src, quality: 60, success: (r) => resolve(r.tempFilePath), fail: () => resolve(src) });
    });

    compress(filePath).then((p) => new Promise((resolve, reject) => {
      fs.readFile({
        filePath: p,
        encoding: 'base64',
        success: (r) => resolve(r.data),
        fail: reject
      });
    })).then((base64) => {
      const date = (this.data.daily[0] && this.data.daily[0].date) || '';
      return api.ai.recognizeMeal(this.data.studentId, {
        image: 'data:image/jpeg;base64,' + base64,
        commit: true,
        date: date,
        meal: this.guessMeal()
      });
    }).then((r) => {
      wx.hideLoading();
      if (!r || !r.ok) {
        wx.showModal({
          title: '识别未完成',
          content: (r && r.hint) || (r && r.error === 'not_configured'
            ? '未配置 DeepSeek API Key，暂时无法识别。可以到「用餐记录」里手动选择菜品。'
            : '识别失败，可以换一张更清晰的照片，或手动记录。'),
          showCancel: false
        });
        return;
      }
      const names = (r.dishes || []).map((d) => d.name).join('、') || '未识别到菜品';
      const blocked = (r.blocked || []).length ? '\n（已按你的饮食禁忌排除 ' + r.blocked.length + ' 项）' : '';
      wx.showModal({
        title: '识别结果 · ' + (r.totals ? r.totals.cal : 0) + ' kcal',
        content: names + '\n蛋白质 ' + (r.totals ? r.totals.protein : 0) + 'g · 脂肪 '
          + (r.totals ? r.totals.fat : 0) + 'g · 纤维 ' + (r.totals ? r.totals.fiber : 0) + 'g' + blocked,
        confirmText: '已记入',
        showCancel: false
      });
      this.load(true);
    }).catch(() => {
      wx.hideLoading();
      wx.showToast({ title: '识别失败，请重试', icon: 'none' });
    });
  },

  guessMeal() {
    const h = new Date().getHours();
    if (h < 10) return '早餐';
    if (h < 16) return '午餐';
    return '晚餐';
  },

  onRetry() {
    this.load(false);
  },

  goMeals() {
    wx.navigateTo({ url: '/pages/meals/meals' });
  }
});
