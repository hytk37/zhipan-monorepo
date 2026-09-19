// ============================================
// 智慧膳系统 · 部署前自检（Preflight）
// ============================================
// 用法：node scripts/preflight.js
// 作用：在本地先按「线上环境」跑一遍，提前发现部署问题：
//       目录是否齐全、依赖是否能解析、Node 版本是否够、AI 是否配置、
//       关键接口（含扫码体验与二维码）是否可用。
// 退出码：0 = 可以部署；1 = 有必须修复的问题

const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');       // 仓库根
const BACKEND = path.join(__dirname, '..');

let pass = 0, warn = 0, fail = 0;
const problems = [];

function ok(name, extra) { pass++; console.log('  \x1b[32mPASS\x1b[0m  ' + name + (extra ? '  ' + extra : '')); }
function warn_(name, extra) { warn++; console.log('  \x1b[33mWARN\x1b[0m  ' + name + (extra ? '  ' + extra : '')); }
function bad(name, extra) { fail++; problems.push(name + (extra ? ' — ' + extra : '')); console.log('  \x1b[31mFAIL\x1b[0m  ' + name + (extra ? '  ' + extra : '')); }

(async () => {
  console.log('\n══════ 智慧膳系统 · 部署前自检 ══════\n');

  // ── 1. 运行环境 ──
  console.log('【运行环境】');
  const major = parseInt(process.version.replace('v', '').split('.')[0], 10);
  if (major >= 18) ok('Node 版本 ' + process.version + '（>=18，内置 fetch 可用）');
  else bad('Node 版本过低：' + process.version, '需要 18 以上');

  const platform = process.platform === 'win32' ? 'Windows（本地演示）' : process.platform + '（疑似线上）';
  ok('运行平台：' + platform);

  // ── 2. 目录结构（线上要用到同级目录）──
  console.log('\n【目录结构】（Render 的 rootDir 必须是仓库根，否则读不到 admin/demo）');
  const need = [
    ['admin/index.html', '管理大屏'],
    ['demo/index.html', '手机体验页（扫码用）'],
    ['demo/qr.html', '投屏二维码页'],
    ['backend/api-server.js', '服务入口'],
    ['render.yaml', 'Render 部署蓝图'],
  ];
  need.forEach(([rel, label]) => {
    const p = path.join(ROOT, rel);
    if (fs.existsSync(p)) ok(label + '：' + rel);
    else bad('缺少 ' + rel, label);
  });

  // ── 3. 依赖可解析 ──
  console.log('\n【依赖】');
  ['express', 'cors', 'qrcode'].forEach((dep) => {
    try { require.resolve(dep); ok(dep + ' 可加载'); }
    catch (e) { bad(dep + ' 缺失', '请在 backend/ 执行 npm install'); }
  });
  try { require.resolve('mysql2'); } catch (e) { warn_('mysql2 未安装（仅数据库层用到，不影响演示）'); }

  // ── 4. 配置 ──
  console.log('\n【配置】');
  const { describe } = require('../config/deepseek');
  const ai = describe();
  if (ai.configured) ok('DeepSeek AI 已配置', ai.models.flash + ' / ' + ai.models.pro + '  ' + ai.keyMasked);
  else warn_('DeepSeek AI 未配置（不填也能演示，AI 文案会降级为规则模板）', '配置方法见 产物/AI功能设计/AI配置说明.md');

  const demoInfo = require('../services/demoInfo');
  const cloud = demoInfo.cloudBaseUrl();
  const addrs = demoInfo.listLanAddresses();
  if (cloud) ok('已检测到云端公网地址（二维码将使用它）', cloud);
  else if (addrs.length) ok('局域网地址可用（本地演示模式）', addrs.map((a) => a.address).join(', '));
  else warn_('未探测到可用的局域网地址', '手机可能无法访问，建议改用 Render 云端部署');

  // ── 5. 接口连通性 ──
  console.log('\n【接口自检】（临时启动一次服务，不占用 3000 端口）');
  const app = require(path.join(BACKEND, 'api-server.js'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  const port = server.address().port;
  const base = 'http://127.0.0.1:' + port;

  async function probe(label, url, validate, required) {
    try {
      const res = await fetch(base + url);
      const isJson = (res.headers.get('content-type') || '').indexOf('json') >= 0;
      const body = isJson ? await res.json() : await res.text();
      const good = res.ok && (!validate || validate(body, res));
      if (good) ok(label);
      else if (required === false) warn_(label, 'HTTP ' + res.status);
      else bad(label, 'HTTP ' + res.status);
      return body;
    } catch (e) {
      bad(label, e.message);
      return null;
    }
  }

  await probe('健康检查 /api/demo/ping', '/api/demo/ping', (j) => j && j.ok === true);
  const cfg = await probe('演示配置 /api/demo/config', '/api/demo/config', (j) => j && j.demoUrl && j.personas);
  await probe('二维码 /api/demo/qr.png', '/api/demo/qr.png?size=240', (t, r) => String(t).indexOf('PNG') >= 0 || (r.headers.get('content-type') || '').indexOf('image/png') >= 0);
  await probe('手机体验页 /demo', '/demo', (t) => String(t).indexOf('本周饮食健康分析') >= 0);
  await probe('投屏二维码页 /demo/qr.html', '/demo/qr.html', (t) => String(t).indexOf('扫码打开体验版') >= 0);
  await probe('管理大屏 /admin', '/admin', (t) => String(t).indexOf('<html') >= 0);
  await probe('周健康分析 /api/ai/health/week/0', '/api/ai/health/week/0', (j) => j && typeof j.score === 'number' && j.analysis);
  await probe('本周菜单 /api/menu/week', '/api/menu/week', (j) => j && j.days && j.days.length);
  await probe('本周用餐记录 /api/ai/week-meals/0', '/api/ai/week-meals/0', (j) => j && j.week && j.stats);

  server.close();

  // ── 6. 演示地址汇总 ──
  console.log('\n【演示地址】（部署到 Render 后会自动变成公网地址）');
  const finalCfg = demoInfo.demoConfig(port, require('../models/data').studentProfiles);
  console.log('  模式      : ' + finalCfg.modeLabel);
  console.log('  体验链接  : ' + finalCfg.demoUrl);
  console.log('  投屏二维码: ' + finalCfg.projectorUrl);
  console.log('  二维码图片: ' + finalCfg.qrUrl);
  console.log('  管理大屏  : ' + finalCfg.adminUrl);

  // ── 7. 汇总 ──
  console.log('\n════════════════════════════════════');
  console.log('  通过 ' + pass + ' / 提醒 ' + warn + ' / 失败 ' + fail);
  if (fail) {
    console.log('\n  必须先解决：');
    problems.forEach((p) => console.log('   ✗ ' + p));
    console.log('');
    process.exit(1);
  }
  console.log('  ✅ 自检通过，可以部署\n');
})().catch((e) => {
  console.error('\n自检脚本异常：', e);
  process.exit(1);
});
