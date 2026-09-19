// ============================================
// 智慧膳系统 · 一键生成公网演示地址（内网穿透）
// ============================================
// 用途：不想注册云平台时的最省事方案 ——
//       在本机跑服务，用 Cloudflare 免费隧道给一个公网 HTTPS 地址，
//       嘉宾用任意网络扫码即可访问（无需备案、无需账号、无需买服务器）。
//
// 用法：
//   node scripts/share.js                 # 自动挑一个空闲端口（从 8080 起，避开 3000）
//   node scripts/share.js --open          # 同上，并在建好隧道后自动打开投屏二维码页
//   node scripts/share.js --port 8090     # 手动指定端口（被占用会明确报错）
//   node scripts/share.js --no-server     # 服务已在运行，只开隧道
//   node scripts/share.js --local         # 不开隧道，只启动服务并打印本机演示地址
//
// 端口说明：
//   默认**不使用 3000**，而是从 8080 起找一个空闲端口，避免与本地其他项目冲突；
//   若该端口已在跑本项目服务，则直接复用，不会重复启动。
//
// 说明：cloudflared 会从 Cloudflare 官方 GitHub Release 下载到 backend/.tools/
//       （仅首次需要，约 50MB；已存在则直接复用）

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const net = require('net');
const dns = require('dns');
const { spawn, spawnSync } = require('child_process');

const args = process.argv.slice(2);
function argVal(name, def) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
function hasFlag(name) { return args.indexOf(name) >= 0; }

const NO_SERVER = hasFlag('--no-server');
const LOCAL_ONLY = hasFlag('--local');
const OPEN_BROWSER = hasFlag('--open');
const PORT_START = 8080;   // 自动挑端口的起点（避开 3000）
const PORT_MAX = 8120;

const BACKEND = path.join(__dirname, '..');
const TOOLS = path.join(BACKEND, '.tools');
const CF_BIN = path.join(TOOLS, process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared');
const CF_URL = process.platform === 'win32'
  ? 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe'
  : 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64';

function log(msg) { console.log(msg); }
function line() { console.log('──────────────────────────────────────────────'); }

/** 用系统默认浏览器打开地址（失败也不影响隧道运行） */
function openInBrowser(url) {
  try {
    const cmd = process.platform === 'win32' ? 'cmd'
      : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const argv = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    spawn(cmd, argv, { detached: true, stdio: 'ignore' }).unref();
    log('  ⑤ 已用默认浏览器打开投屏二维码页');
  } catch (e) {
    log('  ⑤ 打开浏览器失败（不影响使用）：' + e.message);
  }
}

/**
 * 刷新本机 DNS 缓存。
 * 实测踩坑：隧道域名刚生成时，本机若在那一瞬间查过一次 DNS，会把「解析失败」
 * 缓存下来（Windows DNS 客户端缓存 NXDOMAIN），导致本机浏览器打不开自己的隧道地址
 * ——尽管手机（别的网络）完全正常。刷一次缓存即可立刻恢复。
 */
function flushDns() {
  if (process.platform !== 'win32') return;
  try {
    // 用同步版本：必须刷完再去做公网自检，否则会拿着旧的「解析失败」缓存去测
    spawnSync('ipconfig', ['/flushdns'], { stdio: 'ignore' });
  } catch (e) { /* 忽略：非管理员或命令不存在都不影响隧道 */ }
}

/** 调用本机服务的接口（内网穿透脚本与后端之间的私有通道） */
function callLocal(port, method, urlPath, body) {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {};
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request({ host: '127.0.0.1', port, method: method, path: urlPath, headers: headers, timeout: 4000 }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => {
        let json = null; try { json = JSON.parse(buf); } catch (e) {}
        resolve({ code: res.statusCode, json: json });
      });
    });
    req.on('error', () => resolve({ code: 0, json: null }));
    req.on('timeout', () => { req.destroy(); resolve({ code: 0, json: null }); });
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * 把公网地址写给本地服务 —— 这一步很关键：
 * 否则你用局域网地址打开投屏页时，二维码会编码成 http://192.168.x.x:端口/demo，
 * 嘉宾用流量扫必然打不开（就是「只能同一局域网才行」的现象）。
 */
async function publishBaseUrl(port, publicUrl) {
  const r = await callLocal(port, 'POST', '/api/demo/base-url', { url: publicUrl });
  return !!(r.json && r.json.ok === true);
}

/**
 * 从公网侧真实访问一次，确认外人真的能打开。
 * 为什么需要两条通道：
 *   隧道域名刚建好时，本机（或上游路由器）的 DNS 往往还没解析出这个新域名
 *   （负缓存 NXDOMAIN，实测能持续十几到几十秒），但这不代表隧道有问题 ——
 *   手机用的是别的网络，照样能扫开。所以：
 *     通道① 常规 fetch（走本机 DNS）
 *     通道② 公共 DNS 解析出 IP → 用 IP 直连并带上 Host/SNI（绕过本机 DNS 缓存）
 *   只要②通，就说明隧道是好的，只是本机 DNS 慢半拍。
 */
const PUBLIC_DNS = ['223.5.5.5', '119.29.29.29', '1.1.1.1'];

function resolveViaPublicDns(host) {
  return new Promise((resolve) => {
    const r = new dns.Resolver();
    r.setServers(PUBLIC_DNS);
    r.resolve4(host, (e, addrs) => resolve(e ? null : addrs));
  });
}

function httpsGetByIp(host, ip, urlPath) {
  return new Promise((resolve) => {
    const req = https.request({
      host: ip, servername: host, path: urlPath, method: 'GET',
      headers: { Host: host }, timeout: 8000,
    }, (res) => {
      let b = '';
      res.on('data', (c) => { b += c; });
      res.on('end', () => {
        let json = null; try { json = JSON.parse(b); } catch (e) {}
        resolve({ code: res.statusCode, json: json });
      });
    });
    req.on('error', (e) => resolve({ code: 0, err: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ code: 0, err: 'timeout' }); });
    req.end();
  });
}

async function publicSelfTest(publicUrl) {
  const host = new URL(publicUrl).hostname;
  let lastErr = '';

  // 通道①：常规方式（走本机 DNS）
  for (let i = 0; i < 4; i++) {
    try {
      const res = await fetch(publicUrl + '/api/demo/ping', { signal: AbortSignal.timeout(6000) });
      const j = await res.json();
      if (res.ok && j && j.ok === true) return { ok: true, via: 'dns', tries: i + 1 };
    } catch (e) {
      lastErr = (e && e.cause && e.cause.code) || (e && e.message) || 'unknown';
    }
    flushDns();   // 可能是本机缓存了「解析失败」
    await new Promise((r) => setTimeout(r, 1500));
  }

  // 通道②：公共 DNS 解析 + IP 直连（绕过本机 DNS 缓存）
  const ips = await resolveViaPublicDns(host);
  if (ips && ips.length) {
    const r = await httpsGetByIp(host, ips[0], '/api/demo/ping');
    if (r.code === 200 && r.json && r.json.ok === true) {
      flushDns();
      return { ok: true, via: 'ip', dnsPending: true, ip: ips[0] };
    }
    lastErr = lastErr || (r.err || ('HTTP ' + r.code));
  }

  return { ok: false, err: lastErr, dnsResolved: !!(ips && ips.length) };
}

/** 本项目服务是否已在该端口运行（用保活接口探测，避免误判其他程序） */
function serverResponds(port, timeoutMs) {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, method: 'GET', path: '/api/demo/ping', timeout: timeoutMs || 1200 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

/**
 * 探测该端口上的服务是不是「当前版本」。
 * 旧版本（或上次没杀干净留下的残留进程）没有 /api/demo/base-url，
 * 会返回 404 —— 这时不能复用它，否则公网地址写不进去，二维码又会指向局域网。
 */
function hasBaseUrlApi(port) {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, method: 'GET', path: '/api/demo/base-url', timeout: 1500 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

/** 端口是否空闲 */
function portFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '127.0.0.1');
  });
}

/**
 * 决定用哪个端口：
 *   · 显式给了 --port / PORT 环境变量 → 用它（被别的程序占用则报错退出）
 *   · 否则从 8080 起找空闲端口（默认避开 3000）
 *     - 该端口已在跑**当前版本**的本项目服务 → 复用
 *     - 该端口在跑**旧版本/残留**服务 → 跳过，换下一个端口自己起（避免写到旧服务上）
 */
async function resolvePort() {
  const explicit = hasFlag('--port')
    ? parseInt(argVal('--port', ''), 10)
    : (process.env.PORT ? parseInt(process.env.PORT, 10) : null);

  if (explicit) {
    if (await serverResponds(explicit)) {
      if (await hasBaseUrlApi(explicit)) return { port: explicit, reuse: true };
      log('  ⚠️ 端口 ' + explicit + ' 上是【旧版本】服务（缺少地址覆盖接口）——通常是上次没关干净留下的。');
      log('     请先停掉它再运行本脚本；停下它可以用：');
      log('       netstat -ano | findstr :' + explicit + '     然后  taskkill /F /PID <最后一列的PID>');
      log('     或换端口：npm run share -- --port ' + (explicit + 1));
      process.exit(1);
    }
    if (!(await portFree(explicit))) {
      log('  ✗ 端口 ' + explicit + ' 已被其他程序占用。');
      log('    换个端口：npm run share -- --port ' + (explicit + 1) + '    （或不带 --port，自动选择）');
      process.exit(1);
    }
    return { port: explicit, reuse: false, explicit: true };
  }

  let stalePort = null;
  for (let p = PORT_START; p <= PORT_MAX; p++) {
    if (await serverResponds(p)) {
      if (await hasBaseUrlApi(p)) return { port: p, reuse: true, auto: true };
      if (!stalePort) stalePort = p;      // 记住这个旧服务，稍后提示
      continue;                            // 不复用旧服务，继续往后找
    }
    if (await portFree(p)) return { port: p, reuse: false, auto: true, stalePort: stalePort };
  }
  log('  ✗ ' + PORT_START + '-' + PORT_MAX + ' 之间没有空闲端口。');
  log('    请手动指定：npm run share -- --port 9000');
  process.exit(1);
}

function waitServer(port, timeoutMs) {
  const t0 = Date.now();
  return new Promise((resolve) => {
    (function tick() {
      serverResponds(port).then((ok) => {
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
          process.stdout.write('\r  下载中 ' + (received / 1048576).toFixed(1) + ' MB' + (total ? ' / ' + (total / 1048576).toFixed(1) + ' MB' : '') + '   ');
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

  // ① 本地服务与端口
  let child = null;
  let PORT;
  if (NO_SERVER) {
    PORT = parseInt(argVal('--port', process.env.PORT || String(PORT_START)), 10);
    if (!(await serverResponds(PORT, 2000))) {
      log('  ① 指定了 --no-server，但端口 ' + PORT + ' 上没有检测到本项目服务。');
      log('    请先启动（cd backend && npm start），或去掉 --no-server 让脚本自己启动');
      process.exit(1);
    }
    if (!(await hasBaseUrlApi(PORT))) {
      log('  ⚠️ 端口 ' + PORT + ' 上是【旧版本】服务（缺少地址覆盖接口），无法把公网地址写进去。');
      log('     请重启它（Ctrl+C 后重新运行），或去掉 --no-server 让脚本自己起一个新服务');
      process.exit(1);
    }
    log('  ① 复用已在运行的服务（端口 ' + PORT + '）');
  } else {
    const picked = await resolvePort();
    PORT = picked.port;
    if (picked.reuse) {
      log('  ① 复用已在运行的服务（端口 ' + PORT + '）');
    } else {
      if (picked.stalePort) {
        log('  ⚠️ 端口 ' + picked.stalePort + ' 上是【旧版本】服务（上次没关干净留下的），已跳过它。');
        log('     想清理：netstat -ano | findstr :' + picked.stalePort + '   然后  taskkill /F /PID <最后一列的PID>');
      }
      log('  ① 正在启动本地服务（端口 ' + PORT + (picked.auto ? '，已自动避开 3000' : '') + '）…');
      child = spawn(process.execPath, [path.join(BACKEND, 'api-server.js')], {
        cwd: BACKEND,
        env: Object.assign({}, process.env, { PORT: String(PORT) }),
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      child.stdout.on('data', () => {});
      child.stderr.on('data', (d) => process.stderr.write(d));
      if (!(await waitServer(PORT, 15000))) {
        log('     ✗ 服务启动失败，请手动执行 cd backend && npm start 看看报错');
        if (child) child.kill();
        process.exit(1);
      }
      log('     ✓ 服务已就绪');
    }
  }

  // ② 本机演示地址
  // --local 模式要清掉可能残留的公网地址覆盖，否则二维码还指向上次的隧道域名
  if (LOCAL_ONLY) await callLocal(PORT, 'DELETE', '/api/demo/base-url');

  const cfgLocal = JSON.parse(await new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port: PORT, path: '/api/demo/config' }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
  }));
  log('  ② 本机演示地址（局域网可访问）：');
  log('     投屏二维码页 : ' + cfgLocal.projectorUrl);
  log('     学生端       : ' + cfgLocal.demoUrl);
  log('     管理后台     : ' + cfgLocal.adminUrl);

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
  tunnelRef = tunnel;

  let publicUrl = null;
  let buffer = '';
  let basePublished = false;

  async function onTunnelReady(url) {
    line();
    log('  ✅ 公网演示地址已生成（本地端口 ' + PORT + '）');
    log('');
    log('     投屏二维码页 : ' + url + '/demo/qr.html');
    log('                    ↑ 打开这个投屏，页面上有两个二维码');
    log('                      · 学生端   ' + url + '/demo');
    log('                      · 管理后台 ' + url + '/admin');
    log('');

    // 关键一步：把公网地址写给服务端，二维码就一定是公网地址
    basePublished = await publishBaseUrl(PORT, url);
    if (basePublished) {
      log('     ✓ 已写入服务端 → 二维码固定用这个公网地址（用局域网地址打开投屏页也一样）');
    } else {
      log('     ⚠️ 写入服务端失败：请务必用上面这个公网地址打开投屏页，');
      log('        否则二维码会编码成局域网地址，嘉宾用流量扫将打不开');
    }

    flushDns();   // 清掉本机可能缓存下来的「解析失败」

    log('  ⑤ 公网自检中（从外网侧真实访问一次）…');
    const test = await publicSelfTest(url);
    if (test.ok && !test.dnsPending) {
      log('     ✓ 公网自检通过：嘉宾用 4G/5G 或任意 WiFi 都能打开' + (test.tries > 1 ? '（第 ' + test.tries + ' 次重试成功）' : ''));
    } else if (test.ok && test.dnsPending) {
      log('     ✓ 隧道已通，已从公网侧确认可访问（IP ' + test.ip + '）');
      log('       只是本机 DNS 还没解析出这个新域名（已自动刷新缓存）。手机扫码不受影响；');
      log('       本机浏览器若打不开投屏页，等十几秒刷新一次即可。');
    } else {
      log('     ⚠️ 公网自检未通过（' + (test.err || '超时') + '）。手动验证：浏览器打开 ' + url + '/api/demo/ping');
      log('        · 本机也打不开 → 执行 ipconfig /flushdns 后重试');
      log('        · 手机也打不开 → 运营商可能拦截了临时隧道域名，建议改用腾讯云云托管');
      log('        注意：二维码地址已按公网地址生成，仍值得用手机实扫一次');
    }

    log('');
    log('     ⚠️ 演示期间本窗口不要关，关闭即断线');
    line();
    if (OPEN_BROWSER) setTimeout(() => openInBrowser(url + '/demo/qr.html'), 300);
  }

  const onData = (d) => {
    buffer += d.toString();
    const m = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m && !publicUrl) {
      publicUrl = m[0];
      onTunnelReady(publicUrl);
    }
  };
  tunnel.stdout.on('data', onData);
  tunnel.stderr.on('data', onData);

  process.on('exit', () => {
    if (basePublished) { try { callLocal(PORT, 'DELETE', '/api/demo/base-url'); } catch (e) {} }
  });

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
