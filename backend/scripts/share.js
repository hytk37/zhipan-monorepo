// ============================================
// 智慧膳系统 · 一键生成公网演示地址（内网穿透）
// ============================================
// 用途：不想注册云平台时的最省事方案 ——
//       在本机跑服务，用 Cloudflare 免费隧道给一个公网 HTTPS 地址，
//       嘉宾用任意网络扫码即可访问（无需备案、无需账号、无需买服务器）。
//
// 用法：
//   node scripts/share.js              # 启动服务 + 开隧道（默认端口 3000）
//   node scripts/share.js --port 8080  # 换个端口
//   node scripts/share.js --no-server  # 服务已在运行，只开隧道
//   node scripts/share.js --local      # 不开隧道，只启动服务并打印本机演示地址（离线检查用）
//
// 说明：cloudflared 会从 Cloudflare 官方 GitHub Release 下载到 backend/.tools/
//       （仅首次需要，约 50MB；已存在则直接复用）

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { spawn, spawnSync } = require('child_process');

const args = process.argv.slice(2);
function argVal(name, def) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
const PORT = parseInt(argVal('--port', process.env.PORT || '3000'), 10);
const NO_SERVER = args.indexOf('--no-server') >= 0;
const LOCAL_ONLY = args.indexOf('--local') >= 0;

const BACKEND = path.join(__dirname, '..');
const TOOLS = path.join(BACKEND, '.tools');
const CF_BIN = path.join(TOOLS, process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
const CF_URL = process.platform === 'win32'
  ? 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
  : 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';

function log(msg) { console.log(msg); }
function line() { console.log('──────────────────────────────────────────────'); }

function pingServer() {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port: PORT, method: 'GET', path: '/api/demo/ping' }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

function waitServer(timeoutMs) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    (function tick() {
      pingServer().then((ok) => {
        if (ok) return resolve(true);
        if (Date.now() - t0 > timeoutMs) return resolve(false);
        setTimeout(tick, 400);
      });
    })();
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    log('  正在下载 cloudflared（约 50MB，仅首次需要）…');
    const file = fs.createWriteStream(dest);
    let received = 0, lastPrint = 0;
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        return reject(new Error('HTTP ' + res.statusCode + '（可手动下载放到 ' + dest + '）'));
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);
      res.on('data', (c) => {
        received += c.length;
        if (Date.now() - lastPrint > 1500) {
          lastPrint = Date.now();
          const mb = (received / 1048576).toFixed(1);
          process.stdout.write('\r  下载中 ' + mb + ' MB' + (total ? ' / ' + (total / 1048576).toFixed(1) + ' MB' : '') + '   ');
        }
      });
      res.pipe(file);
      file.on('finish', () => { file.close(); process.stdout.write('\r  下载完成                              \n'); resolve(); });
    });
    req.on('error', reject);
    req.setTimeout(120000, () => { req.destroy(new Error('下载超时')); });
  });
}

(async () => {
  line();
  log('  智慧膳系统 · 一键公网演示地址');
  line();

  // ① 本地服务
  let child = null;
  let alreadyUp = await pingServer();
  if (alreadyUp) {
    log('  ① 本地服务已在运行（端口 ' + PORT + '），直接复用');
  } else if (NO_SERVER) {
    log('  ① 指定 --no-server，但端口 ' + PORT + ' 上没检测到服务 —— 请先启动：npm start');
    process.exit(1);
  } else {
    log('  ① 正在启动本地服务（端口 ' + PORT + '）…');
    child = spawn(process.execPath, [path.join(BACKEND, 'api-server.js')], {
      cwd: BACKEND,
      env: Object.assign({}, process.env, { PORT: String(PORT) }),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.on('data', () => {});
    child.stderr.on('data', (d) => process.stderr.write(d));
    const ok = await waitServer(15000);
    if (!ok) {
      log('     ✗ 服务启动失败，请先在 backend/ 目录手动执行 npm start 看看报错');
      if (child) child.kill();
      process.exit(1);
    }
    log('     ✓ 服务已就绪');
  }

  // ② 本机演示地址（局域网模式）
  const cfgLocal = JSON.parse(await new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path: '/api/demo/config' }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  }));
  log('  ② 本机演示地址：' + cfgLocal.demoUrl);

  // 统一收尾：Ctrl+C 时把子进程一起关掉，避免残留占用端口
  let tunnelRef = null;
  const cleanup = () => {
    try { if (tunnelRef) tunnelRef.kill(); } catch (e) {}
    if (child) { try { child.kill(); } catch (e) {} }
    log('\n  已停止' + (tunnelRef ? '隧道与服务' : '服务'));
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  if (LOCAL_ONLY) {
    log('');
    log('  （--local 模式：未开隧道，仅局域网可访问）');
    log(child ? '  服务运行中，按 Ctrl+C 结束' : '  复用了已在运行的服务，本脚本退出');
    if (!child) process.exit(0);
    return;
  }

  // ③ 准备 cloudflared
  if (!fs.existsSync(CF_BIN)) {
    if (!fs.existsSync(TOOLS)) fs.mkdirSync(TOOLS, { recursive: true });
    try {
      await download(CF_URL, CF_BIN);
      if (process.platform !== 'win32') fs.chmodSync(CF_BIN, 0o755);
    } catch (e) {
      log('     ✗ cloudflared 下载失败：' + e.message);
      log('     可手动下载后放到：' + CF_BIN);
      log('     下载地址：' + CF_URL);
      if (child) child.kill();
      process.exit(1);
    }
  } else {
    log('  ③ cloudflared 已就绪（复用本地已有的）');
  }

  // ④ 开隧道
  log('  ④ 正在建立公网隧道…（首次约 5-15 秒）');
  const tunnel = spawn(CF_BIN, ['tunnel', '--url', 'http://localhost:' + PORT, '--no-autoupdate'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let publicUrl = null;
  let buffer = '';
  const onData = (d) => {
    buffer += d.toString();
    const m = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m && !publicUrl) {
      publicUrl = m[0];
      line();
      log('  ✅ 公网演示地址已生成');
      log('');
      log('     体验页  : ' + publicUrl + '/demo');
      log('     投屏页  : ' + publicUrl + '/demo/qr.html   ← 打开这个投屏，二维码会指向公网地址');
      log('     管理大屏: ' + publicUrl + '/admin');
      log('');
      log('     嘉宾用手机（4G/5G 或任意 WiFi）扫码即可体验');
      log('     ⚠️ 演示期间本窗口不要关，关闭即断线');
      line();
    }
  };
  tunnel.stdout.on('data', onData);
  tunnel.stderr.on('data', onData);

  tunnelRef = tunnel;

  setTimeout(() => {
    if (!publicUrl) {
      log('     ✗ 15 秒内未拿到公网地址，隧道原始输出如下：');
      log(buffer.slice(-800));
      if (child) child.kill();
      tunnel.kill();
      process.exit(1);
    }
  }, 15000);
})();
