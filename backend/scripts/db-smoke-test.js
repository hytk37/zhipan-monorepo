#!/usr/bin/env node
/**
 * 数据库层自检（需要可连接的 MySQL；连不上则自动跳过）
 * ============================================================================
 * 检查两件事：
 *   1. repository 的返回值形状与现有 Mock 接口契约一致（前端可直接切换）
 *   2. 视图算出来的统计口径，与前端大屏显示的数字是否同量级
 *
 * 用法： node scripts/db-smoke-test.js
 * ============================================================================
 */
require('../config/env');

const db = require('../config/db');
const studentRepo = require('../repositories/student');
const nutritionRepo = require('../repositories/nutrition');

let pass = 0;
let fail = 0;
const ok = (name, cond, detail) => {
  console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`);
  cond ? pass++ : fail++;
};

async function main() {
  let health;
  try {
    health = await db.healthCheck();
  } catch (e) {
    console.log('\n[跳过] 无法连接数据库：' + e.message);
    console.log('       本机没有 MySQL Server 时属正常，跳过数据库层自检。');
    return;
  }

  console.log('══════ 数据库层自检 ══════');
  console.log('  连接：' + health.database + '（MySQL ' + health.version + '）\n');

  // ① 规模
  const total = await studentRepo.count();
  ok('student 表有数据', total > 0, `studentCount=${total}`);

  // ② 契约：GET /api/students/:id/nutrition/today
  const demoId = 2023010042;
  const today = await nutritionRepo.getTodayForApi(demoId);
  ok('getTodayForApi 返回非空', !!today);
  if (today) {
    const keys = ['calories', 'caloriesTarget', 'protein', 'proteinTarget', 'carbs', 'carbsTarget',
      'fat', 'fatTarget', 'fiber', 'fiberTarget', 'score', 'checked', 'goalType'];
    const missing = keys.filter((k) => !(k in today));
    ok('今日营养字段与 Mock 完全一致', missing.length === 0, missing.join(','));
    ok('热量在合理区间', today.calories > 500 && today.calories < 6000, `${today.calories} kcal`);
  }

  // ③ 契约：GET /api/students/:id/nutrition/history?days=7
  const hist = await nutritionRepo.getHistory(demoId, 7);
  ok('历史营养返回 7 天以内', hist.length > 0 && hist.length <= 7, `rows=${hist.length}`);
  if (hist.length) {
    const k = Object.keys(hist[0]).sort().join(',');
    ok('历史字段与 Mock 一致', k === 'calories,carbs,date,fat,fiber,protein,score', k);
  }

  // ④ 契约：GET /api/students/:id
  const profile = await studentRepo.findById(demoId);
  ok('学生档案可查', !!profile, profile ? profile.name + ' / ' + profile.college : '');
  ok('过敏原为数组', !!profile && Array.isArray(profile.allergyList),
    profile ? JSON.stringify(profile.allergyList) : '');

  // ⑤ 提醒设置
  const remind = await nutritionRepo.getRemind(demoId);
  ok('提醒设置字段齐全',
    'breakfast' in remind && 'breakfastTime' in remind && 'dinnerTime' in remind);

  // ⑥ 统计口径：与前端大屏对照
  const fiber = await nutritionRepo.getFiberDistribution();
  ok('纤维分档返回三档', fiber.counts.length === 3, JSON.stringify(fiber.counts));
  if (total > 100) {
    const sum = fiber.counts.reduce((a, b) => a + b, 0);
    ok('纤维分档合计 = 有营养数据的学生数', Math.abs(sum - total) / total < 0.02,
      `${sum} vs ${total}`);
  }

  const radar = await nutritionRepo.getGroupRadar();
  ok('群体达标率 5 项', radar.actual.length === 5, JSON.stringify(radar.actual));

  const status = await nutritionRepo.getSystemStatus();
  ok('系统状态含 studentCount/mealCount', status.studentCount > 0 && status.mealCount >= 0,
    `同学 ${status.studentCount} / 今日就餐 ${status.mealCount}`);

  // ⑦ 事务：写入一餐 → 汇总被重算
  const dish = await db.queryOne('SELECT id, cal FROM dish ORDER BY id LIMIT 1');
  if (dish) {
    const date = '2026-01-01'; // 用一个不干扰演示数据的历史日期
    const before = await db.queryOne(
      'SELECT calories FROM nutrition_daily WHERE student_id = ? AND stat_date = ?', [demoId, date]);
    const res = await nutritionRepo.addMeal(demoId, date, '加餐', [{ dishId: dish.id, qty: 1 }]);
    const after = await db.queryOne(
      'SELECT calories FROM nutrition_daily WHERE student_id = ? AND stat_date = ?', [demoId, date]);
    ok('addMeal 事务写入成功', !!res.recordId, `recordId=${res.recordId} cal=${res.totalCal}`);
    ok('nutrition_daily 已按明细重算', !!after && after.calories >= res.totalCal,
      `${before ? before.calories : '-'} → ${after ? after.calories : '-'}`);
    // 清理测试数据
    const items = await db.query('SELECT id FROM meal_record WHERE student_id = ? AND meal_date = ?', [demoId, date]);
    for (const it of items) {
      await db.query('DELETE FROM meal_record_item WHERE record_id = ?', [it.id]);
    }
    await db.query('DELETE FROM meal_record WHERE student_id = ? AND meal_date = ?', [demoId, date]);
    await db.query('DELETE FROM nutrition_daily WHERE student_id = ? AND stat_date = ?', [demoId, date]);
    console.log('  （已清理测试写入的数据）');
  }

  console.log('\n  通过 ' + pass + ' / ' + (pass + fail) + '，失败 ' + fail);
  await db.close();
  process.exit(fail ? 1 : 0);
}

main().catch(async function (e) {
  console.error('自检异常：', e);
  try { await db.close(); } catch (_) {}
  process.exit(1);
});
