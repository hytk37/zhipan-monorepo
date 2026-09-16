// ============================================
// 智慧膳系统 · 接口冒烟测试
// ============================================
// 用法：node scripts/smoke-test.js
// 作用：在随机端口启动一次 API，逐个探测全部接口，输出通过/失败汇总。
//      退出码 0 = 全部通过；1 = 有失败。
// 说明：不会占用 3000 端口，可在服务运行时安全执行。
const http = require('http');
const path = require('path');

const app = require(path.join(__dirname, '..', 'api-server.js'));

function request(port, method, urlPath, body, token) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) headers['Authorization'] = 'Bearer ' + token;

    const req = http.request({ host: '127.0.0.1', port, method, path: urlPath, headers }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve({
        code: res.statusCode,
        body: buf,
        json: (() => { try { return JSON.parse(buf); } catch (e) { return null; } })(),
      }));
    });
    req.on('error', (e) => resolve({ code: 0, body: 'ERR ' + e.message, json: null }));
    if (payload) req.write(payload);
    req.end();
  });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail: detail || '' });
}
function expect(name, res, code, extra) {
  const codeOk = res.code === code;
  const extraOk = extra ? extra(res) : true;
  check(name, codeOk && extraOk,
    `期望 ${code}${extraOk ? '' : '/校验失败'}，实际 ${res.code} ${String(res.body).replace(/\s+/g, ' ').slice(0, 60)}`);
}

(async () => {
  const server = app.startServer(0);
  await new Promise((r) => server.once('listening', r));
  const port = server.address().port;

  const adminLogin = await request(port, 'POST', '/api/admin/login', { username: 'admin', password: 'admin123' });
  const adminToken = adminLogin.json && adminLogin.json.token;
  const stupidLogin = await request(port, 'POST', '/api/admin/login', { username: 'admin', password: 'wrong' });
  const stuLogin = await request(port, 'POST', '/api/student/login', { account: 'stu2023010042', password: '123456' });
  const stuToken = stuLogin.json && stuLogin.json.token;

  // ── 认证 ──
  expect('POST /api/admin/login 管理员登录', adminLogin, 200, (r) => !!(r.json && r.json.success && r.json.token));
  expect('POST /api/admin/login 密码错误应 401', stupidLogin, 401);
  expect('POST /api/student/login 学生登录', stuLogin, 200, (r) => !!(r.json && r.json.success && r.json.token));
  expect('GET  /api/student/verify 学生 token 校验', await request(port, 'GET', '/api/student/verify', null, stuToken), 200,
    (r) => !!(r.json && r.json.success));
  expect('GET  /api/student/verify 无效 token 应 401', await request(port, 'GET', '/api/student/verify', null, 'bad_token'), 401);

  // ── overview.js ──
  expect('GET  /api/students 学生列表', await request(port, 'GET', '/api/students'), 200, (r) => Array.isArray(r.json));
  expect('GET  /api/student/1/nutrition 营养详情', await request(port, 'GET', '/api/student/1/nutrition'), 200, (r) => !!r.json);
  expect('GET  /api/overview/fiber-dist 纤维分布', await request(port, 'GET', '/api/overview/fiber-dist'), 200);
  expect('GET  /api/overview/monthly-trend 30日趋势', await request(port, 'GET', '/api/overview/monthly-trend'), 200);
  expect('GET  /api/overview/system-status 系统状态', await request(port, 'GET', '/api/overview/system-status'), 200);

  // ── kitchen.js（/api 前缀，旧路径）──
  const kitchenPaths = ['/kpi', '/group-radar', '/heatmap', '/forecast', '/purchase', '/new-dishes',
    '/overview', '/sales-forecast', '/alerts', '/menu-optimize'];
  for (const p of kitchenPaths) {
    expect('GET  /api' + p, await request(port, 'GET', '/api' + p), 200);
  }

  // ── kitchen.js（/api/kitchen 前缀，小程序使用的路径）──
  const kitchenPrefixed = ['/kpi', '/group-radar', '/heatmap', '/forecast', '/purchase', '/new-dishes',
    '/overview', '/sales-forecast', '/alerts'];
  for (const p of kitchenPrefixed) {
    expect('GET  /api/kitchen' + p, await request(port, 'GET', '/api/kitchen' + p), 200);
  }

  // 两个前缀必须返回一致数据
  const flat = await request(port, 'GET', '/api/kpi');
  const pref = await request(port, 'GET', '/api/kitchen/kpi');
  check('GET  /api/kpi 与 /api/kitchen/kpi 数据一致',
    JSON.stringify(flat.json) === JSON.stringify(pref.json), '两前缀返回不同数据');

  // ── student.js ──
  expect('GET  /api/students/1 学生档案', await request(port, 'GET', '/api/students/1'), 200, (r) => !!(r.json && r.json.name));
  expect('GET  /api/students/1/nutrition/today', await request(port, 'GET', '/api/students/1/nutrition/today'), 200);
  expect('GET  /api/students/1/nutrition/history?days=5', await request(port, 'GET', '/api/students/1/nutrition/history?days=5'), 200,
    (r) => Array.isArray(r.json) && r.json.length === 5);
  expect('GET  /api/students/999 不存在应 404', await request(port, 'GET', '/api/students/999'), 404);
  expect('GET  /api/recommendations/1 推荐', await request(port, 'GET', '/api/recommendations/1'), 200, (r) => Array.isArray(r.json));
  expect('GET  /api/foods/search 搜索', await request(port, 'GET', '/api/foods/search'), 200, (r) => Array.isArray(r.json));
  expect('GET  /api/foods/1 菜品详情', await request(port, 'GET', '/api/foods/1'), 200, (r) => !!(r.json && r.json.name));
  expect('GET  /api/canteens/1/foods 食堂菜品', await request(port, 'GET', '/api/canteens/1/foods'), 200);
  expect('GET  /api/students/1/remind 提醒设置', await request(port, 'GET', '/api/students/1/remind'), 200);
  expect('POST /api/students/1/checkin 打卡', await request(port, 'POST', '/api/students/1/checkin'), 200, (r) => !!(r.json && r.json.success));
  expect('PUT  /api/students/1/remind 保存提醒', await request(port, 'PUT', '/api/students/1/remind',
    { breakfast: true, breakfastTime: '07:00' }), 200);
  expect('PUT  /api/students/1 更新档案', await request(port, 'PUT', '/api/students/1',
    { height: 170, weight: 62 }), 200, (r) => !!(r.json && r.json.success));

  // ── admin.js（需认证）──
  expect('GET  /api/admin/students 需认证：无 token 应 401', await request(port, 'GET', '/api/admin/students'), 401);
  expect('GET  /api/admin/students 学生账号列表', await request(port, 'GET', '/api/admin/students', null, adminToken), 200,
    (r) => !!(r.json && r.json.success && Array.isArray(r.json.list)));
  expect('POST /api/admin/students/batch 批量导入', await request(port, 'POST', '/api/admin/students/batch',
    { students: [{ name: '冒烟测试生', college: '测试学院', gender: '男', age: 20 }] }, adminToken), 200,
    (r) => !!(r.json && r.json.success && r.json.count === 1));
  expect('POST /api/admin/students/batch 空数据应 400', await request(port, 'POST', '/api/admin/students/batch',
    { students: [] }, adminToken), 400);

  // ── 静态托管与兜底 ──
  expect('GET  /admin 管理后台页面', await request(port, 'GET', '/admin'), 200, (r) => r.body.indexOf('<html') >= 0);
  expect('GET  /admin/ 管理后台页面', await request(port, 'GET', '/admin/'), 200, (r) => r.body.indexOf('<html') >= 0);
  expect('GET  / 应重定向到 /admin', await request(port, 'GET', '/'), 302);
  expect('GET  /api/不存在 应返回 JSON 404', await request(port, 'GET', '/api/not-exist'), 404,
    (r) => !!(r.json && r.json.success === false));

  server.close();

  console.log('');
  console.log('══════════ 智慧膳系统 接口冒烟测试 ══════════');
  results.forEach((r) => console.log((r.ok ? '  PASS  ' : '  FAIL  ') + r.name + (r.ok ? '' : '   → ' + r.detail)));
  const failed = results.filter((r) => !r.ok);
  console.log('════════════════════════════════════════');
  console.log('  通过 ' + (results.length - failed.length) + ' / ' + results.length + '，失败 ' + failed.length);
  console.log('');
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error('测试脚本异常：', e);
  process.exit(1);
});
