// ============================================
// 智慧膳系统 · 管理后台 AI 洞察
// ============================================
// 边界②：安全不过模型 —— 人群名单与硬指标由代码给，模型只做解释
// 边界③：输出必过 schema —— 校验失败即降级为规则模板，页面永远有内容

const { chatWithRetry, parseJson } = require('./client');
const { config, isConfigured } = require('../../config/deepseek');
const prompts = require('./prompts');
const reportService = require('../report');

// ─── 缓存（同一自然日内复用，避免反复花钱）──────
const CACHE = { key: '', at: 0, value: null };
const CACHE_TTL = 6 * 60 * 60 * 1000;

function todayKey() {
  // 北京时间当天（与 client.js 的计费口径一致）
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

// ─── 输出校验 ──────────────────────────────────
function validateInsight(o) {
  if (!o || typeof o !== 'object') return false;
  if (typeof o.summary !== 'string' || o.summary.length < 30) return false;
  if (!Array.isArray(o.highlights) || o.highlights.length < 1) return false;
  if (!Array.isArray(o.risks) || o.risks.length < 1) return false;
  if (!Array.isArray(o.actions) || o.actions.length < 1) return false;
  const okItems = (arr, keys) => arr.every((it) => it && typeof it === 'object'
    && keys.every((k) => typeof it[k] === 'string' && it[k].length > 0));
  if (!okItems(o.highlights, ['title', 'detail'])) return false;
  if (!okItems(o.risks, ['title', 'detail'])) return false;
  if (!o.risks.every((r) => typeof r.action === 'string' && r.action.length > 0)) return false;
  if (!o.actions.every((a) => typeof a === 'string' && a.length > 0)) return false;
  return true;
}

// ─── 确定性降级模板（无 Key / 调用失败时用）─────
// 所有数字都取自 report，文案是固定的句式，不会编造
function fallbackInsight(report) {
  const n = report.nutrition || {};
  const t = report.trend || {};
  const k = report.kpi || {};
  const items = n.items || [];
  const worst = items.slice().sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0] || {};
  const fiberItem = items.filter((i) => i.name === '膳食纤维')[0] || {};

  const trendWord = t.calChangePct >= 0 ? '微升' : '微降';
  const friedRate = (report.dishes && report.dishes.friedRate) || 0;
  // 按实际比例生成措辞，避免出现「已经把 14% 压缩到 20% 以内」这种不合逻辑的句子
  const friedLine = friedRate > 20
    ? '把重油做法占比从当前的 ' + friedRate + '% 压缩到 20% 以内，并增设清蒸/白灼窗口'
    : '重油做法占比 ' + friedRate + '%（低于 20% 控制线），把其中的高脂菜品替换为清蒸/白灼做法';
  const friedRisk = friedRate > 20
    ? '建议压到 20% 以内并增设清蒸/白灼窗口'
    : '占比不高但仍是脂肪超标的主要来源，建议把其中的高脂菜品替换为清蒸/白灼做法';

  return {
    summary: '本周日均就餐 ' + k.mealCount + ' 人次，营养记录覆盖率 ' + k.nutritionCoverage + '%。'
      + '食堂供给结构与推荐摄入相比，偏离最大的是「' + (worst.name || '—') + '」（' + (worst.verdict || '—') + '）；'
      + '人均热量 ' + n.avgCal + ' kcal，相比推荐 ' + n.avgCalRec + ' kcal ' + (n.avgCalStatus || '') + '，'
      + '脂肪超标人群占比 ' + n.fatOverRate + '%。'
      + '膳食纤维是持续的短板：达标率仅 ' + n.fiberOkRate + '%，人均 ' + n.fiberAvg + ' g（推荐 ' + n.fiberRec + ' g），'
      + '其中严重不足 ' + (report.fiber && report.fiber.severe) + ' 人。'
      + '近 7 日人均热量较前 7 日' + trendWord + ' ' + Math.abs(t.calChangePct) + '%，整体供应量稳定。'
      + '建议本周优先在「增加蔬菜与粗粮供应比例、控制重油做法」上做一次调整。',
    highlights: [
      { title: '数据覆盖充分', detail: '营养记录 ' + k.recordCount + ' 条，覆盖率 ' + k.nutritionCoverage + '%，准确率 ' + k.accuracy + '%，可支撑供给决策。' },
      { title: '供应量稳定', detail: '近 7 日人均热量 ' + t.last7AvgCal + ' kcal，较前 7 日变化 ' + t.calChangePct + '%，未出现明显波动。' },
      { title: '菜品储备充足', detail: '菜品库 ' + k.dishLibCount + ' 道、覆盖 ' + k.dishCategories + ' 个类别，其中高蛋白菜品 ' + (report.dishes && report.dishes.highProtein) + ' 道。' },
    ],
    risks: [
      {
        title: '纤维缺口',
        detail: '纤维达标率仅 ' + n.fiberOkRate + '%，人均 ' + n.fiberAvg + ' g 远低于推荐 ' + n.fiberRec + ' g' + (fiberItem.verdict ? '（' + fiberItem.verdict + '）' : '') + '，严重不足人群 ' + (report.fiber && report.fiber.severe) + ' 人。',
        action: '在午晚餐固定增加 1 道清炒/凉拌蔬菜，主食窗口提供杂粮饭、玉米、红薯等粗粮选项。',
      },
      {
        title: '脂肪偏高',
        detail: '脂肪超标人群占比 ' + n.fatOverRate + '%，供给端脂肪达推荐的 ' + ((items.filter((i) => i.name === '脂肪')[0] || {}).actual || '—') + '%。',
        action: friedRisk,
      },
      {
        title: '蛋白不足',
        detail: '蛋白质供给为推荐值的 ' + ((items.filter((i) => i.name === '蛋白质')[0] || {}).actual || '—') + '%，与纤维不足同时出现，指向「荤素配比偏蔬菜少、优质蛋白少」。',
        action: '在低价窗口增加鸡蛋、豆制品、鸡胸类菜品，保证每餐至少 1 道高蛋白菜可选。',
      },
    ],
    actions: [
      '午晚餐各固定增加 1 道深色蔬菜，价格维持在低价档',
      '主食窗口新增杂粮饭/蒸红薯，与白米饭同价',
      friedLine,
      '为过敏与特殊饮食学生设置专用窗口或明确标识',
      '每周按纤维达标率复盘一次菜单调整效果',
    ],
  };
}

// ─── 主流程 ────────────────────────────────────
/**
 * 生成/读取食堂运营洞察
 * @param {object} [opts]
 * @param {boolean} [opts.refresh] 强制重新生成
 * @param {object}  [opts.report]  复用已算好的报告（避免重复计算）
 */
async function buildInsight(opts) {
  const o = opts || {};
  const report = o.report || reportService.buildDailyReport();
  const key = 'admin:' + todayKey();

  if (!o.refresh && CACHE.value && CACHE.key === key && (Date.now() - CACHE.at) < CACHE_TTL) {
    return { ...CACHE.value, cached: true };
  }

  let insight = null;
  let source = 'fallback';
  let aiError = null;
  let usage = null;
  let ms = 0;

  const res = await chatWithRetry({
    model: config.models.flash,
    tag: 'admin-insight',
    json: true,
    maxTokens: 1600,
    messages: [
      { role: 'system', content: prompts.ADMIN_INSIGHT_SYSTEM },
      { role: 'user', content: prompts.buildAdminInsightUser(report) },
    ],
  });

  if (res.ok) {
    const parsed = parseJson(res.content);
    if (validateInsight(parsed)) {
      insight = parsed;
      source = 'ai';
      usage = res.usage || null;
      ms = res.ms || 0;
    } else {
      aiError = 'invalid_json';
    }
  } else {
    aiError = res.error || 'ai_failed';
    ms = res.ms || 0;
  }

  if (!insight) insight = fallbackInsight(report);

  const value = {
    source: source,                       // 'ai' | 'fallback'
    insight: insight,
    aiError: aiError,
    usage: usage,
    ms: ms,
    generatedAt: new Date().toISOString(),
    cached: false,
    configured: isConfigured(),
  };

  CACHE.key = key;
  CACHE.at = Date.now();
  CACHE.value = value;
  return value;
}

/**
 * 管理端追问（基于同一份运营数据）
 * @param {string} question
 * @returns {Promise<{ok:boolean, answer?:string, source:string, error?:string}>}
 */
async function askAdmin(question) {
  const q = String(question || '').trim();
  if (!q) return { ok: false, error: 'empty_question', source: 'none' };
  if (q.length > 500) return { ok: false, error: 'too_long', source: 'none' };

  const report = reportService.buildDailyReport();
  const res = await chatWithRetry({
    model: config.models.flash,
    tag: 'admin-coach',
    maxTokens: 700,
    messages: [
      { role: 'system', content: prompts.ADMIN_COACH_SYSTEM },
      { role: 'user', content: prompts.buildAdminCoachContext(report) + '\n\n【管理者的问题】\n' + q },
    ],
  });

  if (res.ok && res.content && res.content.trim()) {
    return { ok: true, answer: res.content.trim(), source: 'ai', usage: res.usage || null };
  }
  // 降级：仍然给出有信息量的回答（引用真实数字），并说明是模板
  const n = report.nutrition || {};
  return {
    ok: true,
    source: 'fallback',
    aiError: res.error || 'empty',
    answer: '（当前为离线模板回答）本周膳食纤维达标率 ' + n.fiberOkRate + '%、人均 ' + n.fiberAvg + ' g（推荐 ' + n.fiberRec + ' g），'
      + '脂肪超标人群 ' + n.fatOverRate + '%，人均热量 ' + n.avgCal + ' kcal（' + (n.avgCalStatus || '') + '）。'
      + '建议从「增加蔬菜与粗粮供应、压缩重油做法比例」入手；更细的问题可配置 API Key 后追问。',
  };
}

/** 仅供测试/调试：清空缓存 */
function clearCache() { CACHE.key = ''; CACHE.at = 0; CACHE.value = null; }

module.exports = { buildInsight, askAdmin, fallbackInsight, validateInsight, clearCache };
