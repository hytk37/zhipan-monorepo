// ============================================
// 智慧膳系统 · 日历工具（时间自动同步）
// ============================================
// 菜单数据来自「第13周食谱」，但对外展示的日期必须跟随当前时间，
// 否则页面会一直停在 2026-05-25 那种历史日期上。
// 本模块把「按星期几组织的菜单模板」锚定到**当前自然周**，
// 并算出每天的 今天 / 昨天 / 周X 标签。

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const WEEKDAY_SHORT = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/** 本地时间的 YYYY-MM-DD */
function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/** 解析 YYYY-MM-DD → Date（本地零点） */
function parseDate(str) {
  const p = String(str || '').split('-');
  if (p.length !== 3) return null;
  const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return isNaN(d.getTime()) ? null : d;
}

function addDays(d, n) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

/** 本周一（本地零点） */
function startOfWeek(base) {
  const d = base ? new Date(base.getTime()) : new Date();
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7;   // 周一=0 … 周日=6
  return addDays(d, -offset);
}

/** ISO 周序号（第 N 周） */
function weekNumber(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 3);       // 移到本周四
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const fDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - fDay + 3);
  return 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
}

/** 中文短日期：2026-09-18 → 9月18日 */
function formatCn(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return dateStr || '';
  return (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

/** 相对标签：今天 / 昨天 / 明天 / 周X */
function relativeLabel(dateStr, base) {
  const d = parseDate(dateStr);
  if (!d) return '';
  const today = base ? new Date(base.getTime()) : new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (24 * 3600 * 1000));
  if (diff === 0) return '今天';
  if (diff === -1) return '昨天';
  if (diff === 1) return '明天';
  if (diff === -2) return '前天';
  return WEEKDAY_SHORT[d.getDay()];
}

/** 「星期一」→ 周一 */
function shortWeekday(dayName) {
  const i = WEEKDAYS.indexOf(dayName);
  return i >= 0 ? WEEKDAY_SHORT[i] : String(dayName || '').replace('星期', '周');
}

/**
 * 把按星期几组织的菜单模板锚定到当前自然周
 * @param {{week?:string, dateRange?:string, days:Array}} menu 菜单模板（days[].day 为「星期X」）
 * @param {Date} [now] 基准时间（默认取当前时间）
 * @returns 带真实日期的菜单（days[].date / weekday / dayLabel / isToday），并保留原始来源信息
 */
function anchorMenuToCurrentWeek(menu, now) {
  const base = now ? new Date(now.getTime()) : new Date();
  const monday = startOfWeek(base);
  const todayStr = toDateStr(base);
  const wkNo = weekNumber(base);

  const days = (menu.days || []).map((d) => {
    const idx = WEEKDAYS.indexOf(d.day);
    const offset = idx >= 0 ? (idx + 6) % 7 : 0;      // 周一=0
    const dateObj = addDays(monday, offset);
    const dateStr = toDateStr(dateObj);
    return {
      day: d.day,
      weekday: shortWeekday(d.day),
      date: dateStr,
      dayLabel: relativeLabel(dateStr, base),
      isToday: dateStr === todayStr,
      isPast: dateObj < monday ? false : dateObj <= base,
      // 原始食谱里的日期，仅作溯源
      menuDate: d.date,
      meals: d.meals,
    };
  });

  const first = days.length ? days[0].date : toDateStr(monday);
  const last = days.length ? days[days.length - 1].date : toDateStr(addDays(monday, 6));

  return {
    week: '本周（第' + wkNo + '周）',
    weekNo: wkNo,
    dateRange: formatCn(first) + ' ~ ' + formatCn(last),
    startDate: first,
    endDate: last,
    updatedAt: new Date(base.getTime()).toISOString(),
    sourceWeek: menu.week || '',
    sourceDateRange: menu.dateRange || '',
    days: days,
  };
}

module.exports = {
  WEEKDAYS, WEEKDAY_SHORT,
  toDateStr, parseDate, addDays, startOfWeek, weekNumber,
  formatCn, relativeLabel, shortWeekday, anchorMenuToCurrentWeek,
};
