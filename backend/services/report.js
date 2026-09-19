// ============================================
// 智慧膳系统 · 报表数据（纯计算层）
// ============================================
// 边界：本文件只做「从原始数据算出指标」，不调用任何 AI。
//       AI 只负责解释这些算好的数字（services/ai/adminInsight.js）。
// 数据来源：models/data.js（食堂 KPI / 营养雷达 / 纤维分布 / 30 日趋势 /
//          菜品库 / 学生画像 / 本周菜单），全部为系统既有口径，不新增判定标准。

const {
  systemStatus, kitchenKPI, groupRadar, fiberDist, monthlyTrend,
  studentProfiles, nutritionData, foodDB,
} = require('../models/data');
const cal = require('./calendar');
const weekMeals = require('./weekMeals');

// ─── 小工具 ────────────────────────────────────
function round1(n) { return Math.round(Number(n) * 10) / 10; }
function avgOf(arr) {
  const v = (arr || []).filter((x) => typeof x === 'number' && !isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
}
/** 变化率（%），保留一位小数 */
function changePct(cur, prev) {
  if (!prev) return 0;
  return round1(((cur - prev) / prev) * 100);
}
/** 菜品库统一成数组（foodDB 可能是对象或数组） */
function dishList() {
  if (!foodDB) return [];
  return Array.isArray(foodDB) ? foodDB : Object.keys(foodDB).map((k) => foodDB[k]);
}

// ─── 1. 关键指标 ───────────────────────────────
function buildKpi() {
  const s = systemStatus || {};
  const k = kitchenKPI || {};
  const stu = s.studentCount || 0;
  const meals = k.mealCount || s.mealCount || 0;
  const lib = dishList().length;
  return {
    studentCount: stu,
    mealCount: meals,
    mealsPerStudent: stu ? round1(meals / stu) : 0,
    recordCount: s.recordCount || 0,
    // 注意区分两个口径：dishCount = 本周菜单供应的菜次数；dishLibCount = 菜品库总道数
    dishCount: s.dishCount || lib,
    dishLibCount: lib,
    dishCategories: s.dishCategories || 0,
    nutritionCoverage: s.nutritionCoverage || 0,
    accuracy: s.accuracy || 0,
  };
}

// ─── 2. 营养达标情况（食堂供给 vs 推荐摄入）─────
function buildNutrition() {
  const g = groupRadar || { labels: [], actual: [], standard: [] };
  const k = kitchenKPI || {};
  const items = (g.labels || []).map((name, i) => {
    const standard = (g.standard || [])[i] || 100;
    const actual = (g.actual || [])[i] || 0;
    const diff = Math.round(((actual - standard) / standard) * 100);
    let verdict;
    if (Math.abs(diff) <= 5) verdict = '接近推荐';
    else verdict = (diff > 0 ? '高于推荐 ' : '低于推荐 ') + Math.abs(diff) + '%';
    let level;
    if (Math.abs(diff) <= 5) level = 'ok';
    else if (Math.abs(diff) < 20) level = 'watch';
    else level = 'risk';
    return { name, actual, standard, diff, verdict, level };
  });
  return {
    items,
    avgCal: k.avgCal || 0,
    avgCalRec: k.avgCalRec || 0,
    avgCalStatus: k.avgCalStatus || '',
    fatOverRate: k.fatOverRate || 0,
    fatOverChange: k.fatOverChange || '',
    fiberOkRate: k.fiberOkRate || 0,
    fiberAvg: k.fiberAvg || 0,
    fiberRec: k.fiberRec || 0,
    fiberOkCount: k.fiberOkCount || 0,
  };
}

// ─── 3. 膳食纤维分档 ───────────────────────────
function buildFiber() {
  const f = fiberDist || { labels: [], data: [], counts: [] };
  const counts = f.counts || [];
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  return {
    labels: f.labels || [],
    counts,
    total,
    severe: counts[0] || 0,
    severeRate: Math.round(((counts[0] || 0) / total) * 100),
  };
}

// ─── 4. 30 日趋势（近 7 日 vs 前 7 日）─────────
function buildTrend() {
  const t = monthlyTrend || { days: [], calData: [], fiberData: [] };
  const calData = t.calData || [];
  const fiberData = t.fiberData || [];
  const last7 = calData.slice(-7);
  const prev7 = calData.slice(-14, -7);
  const last7F = fiberData.slice(-7);
  const prev7F = fiberData.slice(-14, -7);
  const last7Avg = Math.round(avgOf(last7));
  const prev7Avg = Math.round(avgOf(prev7));
  const last7Fiber = round1(avgOf(last7F));
  const prev7Fiber = round1(avgOf(prev7F));
  return {
    days: t.days || [],
    calSeries: calData,
    fiberSeries: fiberData,
    last7AvgCal: last7Avg,
    prev7AvgCal: prev7Avg,
    calChangePct: changePct(last7Avg, prev7Avg),
    last7AvgFiber: last7Fiber,
    prev7AvgFiber: prev7Fiber,
    fiberChangePct: changePct(last7Fiber, prev7Fiber),
    rangeText: ((t.days || [])[0] || '') + ' ~ ' + ((t.days || [])[t.days.length - 1] || ''),
  };
}

// ─── 5. 菜品供给结构（按类别）──────────────────
function buildDishStructure() {
  const list = dishList();
  const byCat = {};
  let highProtein = 0, fried = 0, lightVeg = 0;
  const FRIED = ['炸', '干锅', '红烧', '干煸', '脆皮', '香辣', '奥尔良', '粉蒸', '卤', '回锅'];
  list.forEach((d) => {
    const cat = d.cat || '未分类';
    byCat[cat] = (byCat[cat] || 0) + 1;
    if ((d.protein || 0) >= 20) highProtein++;
    if (FRIED.some((w) => String(d.name || '').indexOf(w) >= 0)) fried++;
    if (cat === '素菜' && (d.fat || 0) <= 10) lightVeg++;
  });
  const items = Object.keys(byCat).map((cat) => ({ cat, count: byCat[cat] }))
    .sort((a, b) => b.count - a.count);
  return {
    total: list.length,
    items,
    highProtein,
    highProteinRate: list.length ? Math.round((highProtein / list.length) * 100) : 0,
    fried,
    friedRate: list.length ? Math.round((fried / list.length) * 100) : 0,
    lightVeg,
  };
}

// ─── 6. 重点关注名单（抽样，非全校统计）────────
function buildFocusStudents() {
  const keys = Object.keys(studentProfiles || {});
  const out = keys.map((k) => {
    const p = studentProfiles[k] || {};
    const n = (nutritionData || {})[k] || {};
    const issues = [];
    if (p.allergyList && p.allergyList.length) issues.push('过敏原：' + p.allergyList.join('、'));
    if (p.diet && p.diet !== '无限制') issues.push('饮食限制：' + p.diet);
    // 这些状态文本本身就是代码算好的（如「超标 32%」），直接引用，不重新判定
    [n.calStatus, n.proteinStatus, n.fatStatus, n.fiberStatus].forEach((s) => {
      if (s && s !== '正常') issues.push(s);
    });
    return {
      name: p.name || ('学生' + k),
      college: p.college || '—',
      diet: p.diet || '无限制',
      allergy: (p.allergyList || []).join('、') || '无',
      avgScore: typeof p.avgScore === 'number' ? p.avgScore : null,
      goal: p.goal || '',
      issues,
    };
  });
  // 评分低的排前面（管理者优先关注）
  return out.sort((a, b) => (a.avgScore == null ? 999 : a.avgScore) - (b.avgScore == null ? 999 : b.avgScore));
}

// ─── 7. 今日菜单 ───────────────────────────────
function buildTodayMenu() {
  try {
    const menu = weekMeals.currentWeekMenu();
    const today = (menu.days || []).filter((d) => d.isToday)[0];
    const day = today || (menu.days || [])[0];
    if (!day) return null;
    return {
      week: menu.week,
      dateRange: menu.dateRange,
      isToday: !!today,
      dateCn: cal.formatCn(day.date),
      weekday: day.weekday,
      meals: (day.meals || []).map((m) => ({
        meal: m.meal,
        dishes: (m.lines || []).reduce((acc, l) => acc.concat(l.items || []), []),
      })),
    };
  } catch (e) {
    return null;
  }
}

// ─── 组装 ──────────────────────────────────────
function buildDailyReport() {
  const now = new Date();
  const todayStr = cal.toDateStr(now);
  const week = (function () {
    try { const m = weekMeals.currentWeekMenu(); return m; } catch (e) { return null; }
  })();

  return {
    meta: {
      title: '智慧膳系统 · 食堂营养运营报告',
      generatedAt: now.toISOString(),
      dateCn: cal.formatCn(todayStr),
      generatedAtCn: cal.formatCn(todayStr) + ' ' +
        String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
      weekLabel: (week && week.week) || '本周',
      dateRange: (week && week.dateRange) || '',
      sourceWeek: (week && week.sourceWeek) || '',
      runMode: '本地/云端服务',
    },
    kpi: buildKpi(),
    nutrition: buildNutrition(),
    fiber: buildFiber(),
    trend: buildTrend(),
    dishes: buildDishStructure(),
    focusStudents: buildFocusStudents(),
    menu: buildTodayMenu(),
    disclaimer: '本报告数据来自学生营养记录汇总与食堂菜单库，用于膳食改进参考，不构成医学诊断或治疗建议。',
  };
}

module.exports = { buildDailyReport, buildKpi, buildNutrition, buildFiber, buildTrend, buildDishStructure, buildFocusStudents };
