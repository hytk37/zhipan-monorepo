// ============================================
// 智慧膳系统 · 运营报表路由
// ============================================
// GET /api/report/daily        运营报告（JSON：指标 + 分布 + 趋势 + AI 洞察）
// GET /api/report/daily.csv    同上，CSV 文件下载（Excel 可直接打开）
//
// 说明：报告数据全部由 services/report.js 计算（AI 只补充文字结论），
//      所以即使未配置 DeepSeek Key，报告依然是完整的真实数据。

const { Router } = require('express');
const router = Router();
const reportService = require('../services/report');
const adminInsight = require('../services/ai/adminInsight');

function wantFlag(v) {
  return v === '1' || v === 'true' || v === 'yes';
}

// ─── JSON 报告 ─────────────────────────────────
router.get('/report/daily', async (req, res) => {
  const refresh = wantFlag(req.query.refresh);
  const noai = wantFlag(req.query.noai);
  const report = reportService.buildDailyReport();

  let insight = null;
  if (!noai) {
    try {
      insight = await adminInsight.buildInsight({ report, refresh: refresh });
    } catch (e) {
      insight = {
        source: 'fallback',
        insight: adminInsight.fallbackInsight(report),
        aiError: e.message || 'insight_failed',
      };
    }
  }
  res.json({ ok: true, report: report, insight: insight });
});

// ─── CSV 下载 ──────────────────────────────────
function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function csvRow(arr) { return arr.map(csvCell).join(','); }

function buildCsv(report, insight) {
  const L = [];
  const k = report.kpi || {};
  const n = report.nutrition || {};
  const t = report.trend || {};
  const d = report.dishes || {};
  const f = report.fiber || {};
  const m = report.meta || {};

  L.push(csvRow(['智慧膳系统 · 食堂营养运营报告']));
  L.push(csvRow(['生成时间', m.generatedAtCn || '']));
  L.push(csvRow(['数据周', m.weekLabel || '', m.dateRange || '']));
  L.push(csvRow(['食谱来源', m.sourceWeek || '']));
  L.push('');

  L.push(csvRow(['【一、关键指标】']));
  L.push(csvRow(['指标', '数值']));
  L.push(csvRow(['在校学生数（人）', k.studentCount]));
  L.push(csvRow(['日均就餐人次', k.mealCount]));
  L.push(csvRow(['人均日就餐次数', k.mealsPerStudent]));
  L.push(csvRow(['营养记录条数', k.recordCount]));
  L.push(csvRow(['本周菜单菜品数', k.dishCount]));
  L.push(csvRow(['菜品库总道数', k.dishLibCount]));
  L.push(csvRow(['菜品类别数', k.dishCategories]));
  L.push(csvRow(['营养数据覆盖率（%）', k.nutritionCoverage]));
  L.push(csvRow(['数据准确率（%）', k.accuracy]));
  L.push('');

  L.push(csvRow(['【二、营养供给 vs 推荐摄入】']));
  L.push(csvRow(['指标', '实际（占推荐 %）', '推荐基准（%）', '结论']));
  (n.items || []).forEach((i) => L.push(csvRow([i.name, i.actual, i.standard, i.verdict])));
  L.push(csvRow(['人均热量（kcal）', n.avgCal, n.avgCalRec, n.avgCalStatus]));
  L.push(csvRow(['脂肪超标人群占比（%）', n.fatOverRate, '', '环比 ' + (n.fatOverChange || '')]));
  L.push(csvRow(['膳食纤维达标率（%）', n.fiberOkRate, '', '人均 ' + n.fiberAvg + 'g / 推荐 ' + n.fiberRec + 'g']));
  L.push('');

  L.push(csvRow(['【三、膳食纤维分档】']));
  L.push(csvRow(['分档', '人数', '占比（%）']));
  (f.labels || []).forEach((label, i) => {
    const cnt = (f.counts || [])[i] || 0;
    L.push(csvRow([label, cnt, Math.round((cnt / (f.total || 1)) * 100)]));
  });
  L.push('');

  L.push(csvRow(['【四、近 30 日趋势】']));
  L.push(csvRow(['指标', '近 7 日', '前 7 日', '变化（%）']));
  L.push(csvRow(['人均热量（kcal）', t.last7AvgCal, t.prev7AvgCal, t.calChangePct]));
  L.push(csvRow(['人均膳食纤维（g）', t.last7AvgFiber, t.prev7AvgFiber, t.fiberChangePct]));
  L.push('');

  L.push(csvRow(['【五、菜品供给结构】']));
  L.push(csvRow(['类别', '数量（道）']));
  (d.items || []).forEach((i) => L.push(csvRow([i.cat, i.count])));
  L.push(csvRow(['合计', d.total]));
  L.push(csvRow(['高蛋白菜品（≥20g/份）', d.highProtein, '占 ' + d.highProteinRate + '%']));
  L.push(csvRow(['重油做法菜品', d.fried, '占 ' + d.friedRate + '%']));
  L.push(csvRow(['清淡素菜', d.lightVeg]));
  L.push('');

  L.push(csvRow(['【六、重点关注学生（抽样名单）】']));
  L.push(csvRow(['姓名', '学院', '饮食限制', '过敏原', '近期评分', '当前问题']));
  (report.focusStudents || []).forEach((s) => {
    L.push(csvRow([s.name, s.college, s.diet, s.allergy, s.avgScore == null ? '' : s.avgScore, (s.issues || []).join(' / ')]));
  });
  L.push('');

  if (report.menu) {
    L.push(csvRow(['【七、今日菜单】']));
    L.push(csvRow([report.menu.week || '', report.menu.dateCn || '', report.menu.weekday || '', report.menu.isToday ? '（今天）' : '']));
    (report.menu.meals || []).forEach((meal) => {
      L.push(csvRow([meal.meal, (meal.dishes || []).join('、')]));
    });
    L.push('');
  }

  if (insight && insight.insight) {
    const ai = insight.insight;
    L.push(csvRow(['【八、AI 运营洞察】']));
    L.push(csvRow(['生成方式', insight.source === 'ai' ? 'DeepSeek 生成' : '规则模板（未配置 API Key 或调用失败）']));
    L.push(csvRow(['总体结论', ai.summary || '']));
    (ai.highlights || []).forEach((h, i) => L.push(csvRow(['亮点' + (i + 1), h.title, h.detail])));
    (ai.risks || []).forEach((r, i) => L.push(csvRow(['风险' + (i + 1), r.title, r.detail, '处置：' + (r.action || '')])));
    (ai.actions || []).forEach((a, i) => L.push(csvRow(['建议' + (i + 1), a])));
    L.push('');
  }

  L.push(csvRow(['【说明】']));
  L.push(csvRow([report.disclaimer || '']));

  // 带 BOM，Excel 打开中文不乱码
  return '\uFEFF' + L.join('\r\n');
}

router.get('/report/daily.csv', async (req, res) => {
  const withAi = !wantFlag(req.query.noai);
  const report = reportService.buildDailyReport();
  let insight = null;
  if (withAi) {
    try {
      insight = await adminInsight.buildInsight({ report: report });
    } catch (e) { insight = null; }
  }
  const csv = buildCsv(report, insight);
  const asciiName = 'smart-canteen-report-' + (report.meta.generatedAt || '').slice(0, 10) + '.csv';
  const cnName = '食堂营养运营报告-' + (report.meta.dateCn || '') + '.csv';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition',
    'attachment; filename="' + asciiName + '"; filename*=UTF-8\'\'' + encodeURIComponent(cnName));
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv);
});

module.exports = router;
module.exports.buildCsv = buildCsv;   // 供测试引用
