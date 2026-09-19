// ============================================
// 智慧膳系统 · 演示模式信息
// ============================================
// 支持两种演示环境：
//   ① 云端（Render 等 PaaS）：自动读取平台注入的公网地址 → 任何网络扫码都能打开
//   ② 本地局域网：自动探测可访问的局域网 IP（排除 VMware/VirtualBox/Hyper-V 虚拟网卡）
// 演示链接与二维码都基于这里算出的地址。

const os = require('os');

// 虚拟网卡关键字（这些地址手机连不上，必须排除）
const VIRTUAL_HINTS = ['vmnet', 'virtualbox', 'vethernet', 'hyper-v', 'loopback', 'docker', 'wsl', 'tap', 'tun'];
// 优先网卡关键字（真机上网用的）
const PREFER_HINTS = ['wlan', 'wi-fi', 'wifi', '无线', 'ethernet', '以太网', 'realtek', 'intel'];

function isPrivateV4(ip) {
  if (/^192\.168\./.test(ip)) return true;
  if (/^10\./.test(ip)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
}

/**
 * 这个地址是不是「只有同一个局域网才能访问」的。
 * 用途：决定投屏页要不要提示「嘉宾用流量扫不开」，以及二维码有没有意义。
 * 注意不能只看是否云端部署 —— 本地演示时如果用局域网地址打开投屏页，
 * 得到的地址也是内网的，必须如实报出来。
 */
const PRIVATE_BASE_RE = /^https?:\/\/(localhost|127\.|0\.0\.0\.0|::1|\[::1\]|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
function isPrivateBase(url) {
  return PRIVATE_BASE_RE.test(String(url || ''));
}

/** 云端平台注入的公网地址（Koyeb / Render / Vercel 都会自动提供） */
function cloudBaseUrl() {
  // 手动指定优先
  if (process.env.PUBLIC_BASE_URL) return normalizeUrl(process.env.PUBLIC_BASE_URL);
  // Koyeb：注入 KOYEB_PUBLIC_DOMAIN（形如 xxx-org.koyeb.app，不带协议）
  if (process.env.KOYEB_PUBLIC_DOMAIN) return normalizeUrl(process.env.KOYEB_PUBLIC_DOMAIN);
  // Render：注入 RENDER_EXTERNAL_URL（含协议）
  if (process.env.RENDER_EXTERNAL_URL) return normalizeUrl(process.env.RENDER_EXTERNAL_URL);
  if (process.env.RENDER_EXTERNAL_HOSTNAME) return normalizeUrl('https://' + process.env.RENDER_EXTERNAL_HOSTNAME);
  // 其他平台
  if (process.env.VERCEL_URL) return normalizeUrl(process.env.VERCEL_URL);
  return null;
}

/** 统一成 https://域名（去掉尾部斜杠、补协议）—— 用于环境变量这类「可信来源」 */
function normalizeUrl(raw) {
  let url = String(raw || '').trim().replace(/\/+$/, '');
  if (!url) return null;
  if (url.indexOf('http') !== 0) url = 'https://' + url;
  return url;
}

/**
 * 严格校验基础地址（用于接口写入的「外部输入」）：
 * 必须是 http/https、主机名合法、无空格。
 * 不能只做字符串拼接 —— 否则 `not a url` 这种会被补成 `https://not a url` 直接生效。
 */
function validateBaseUrl(raw) {
  const s = String(raw || '').trim();
  if (!s || /\s/.test(s)) return null;
  const withProto = s.indexOf('http') === 0 ? s : 'https://' + s;
  let u;
  try { u = new URL(withProto); } catch (e) { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const host = u.hostname;
  if (!host) return null;
  const isIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const looksDomain = host.indexOf('.') > 0;      // 域名至少要有两级
  if (!isIPv4 && !looksDomain && host !== 'localhost') return null;
  if (isIPv4 && host.split('.').some((n) => parseInt(n, 10) > 255)) return null;
  return u.origin;
}

// ─── 运行期公网地址（内网穿透专用）────────────────────
// 背景：小程序/投屏页的二维码地址默认由「请求域名」推导，这在云端是对的；
// 但本地演示时你可能是用局域网地址（http://192.168.x.x:8080/demo/qr.html）打开的投屏页，
// 于是二维码就编码了局域网地址 —— 嘉宾用流量扫必然打不开。
// 解决：share.js 建成隧道后调用 POST /api/demo/base-url 把公网地址写进来，
// 之后无论从哪个地址访问，二维码都用这个公网地址。
let runtimeBase = null;                       // { url, at }
const RUNTIME_BASE_TTL = 12 * 60 * 60 * 1000; // 12 小时，避免隧道早就关了还一直指过去

/** 写入运行期公网地址（传 null / 空值即清除）；非法地址返回 null 不生效 */
function setRuntimeBaseUrl(url) {
  const u = url ? validateBaseUrl(url) : null;
  runtimeBase = u ? { url: u, at: Date.now() } : null;
  return runtimeBase ? runtimeBase.url : null;
}

/** 读取运行期公网地址（过期自动失效） */
function getRuntimeBaseUrl() {
  if (!runtimeBase) return null;
  if (Date.now() - runtimeBase.at > RUNTIME_BASE_TTL) { runtimeBase = null; return null; }
  return runtimeBase.url;
}

/**
 * 从请求头推导「访问者实际使用的地址」——这是最准确的一种，
 * 也是国内平台（腾讯云 CloudBase 等）不注入任何环境变量时的兜底方案。
 * 只对 localhost / 127.0.0.1 这类本机地址返回 null（二维码指向 localhost 对嘉宾没用）。
 * @param {object} req Express 请求（可选）
 */
function baseFromRequest(req) {
  if (!req || !req.headers) return null;
  const rawHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (!rawHost) return null;
  const hostname = rawHost.split(':')[0].toLowerCase().replace(/^\[|\]$/g, '');
  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].indexOf(hostname) >= 0) return null;
  let proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  if (!proto) proto = req.secure ? 'https' : 'http';
  return proto.toLowerCase() + '://' + rawHost;
}

/**
 * 列出可用于局域网演示的地址（按可用性排序）
 * @returns {Array<{name:string, address:string, preferred:boolean}>}
 */
function listLanAddresses() {
  const ifs = os.networkInterfaces();
  const out = [];
  Object.keys(ifs).forEach((name) => {
    const low = String(name).toLowerCase();
    if (VIRTUAL_HINTS.some((h) => low.indexOf(h) >= 0)) return;
    (ifs[name] || []).forEach((info) => {
      if (info.family !== 'IPv4' || info.internal) return;
      if (!isPrivateV4(info.address)) return;
      if (/^169\.254\./.test(info.address)) return;
      out.push({
        name: name,
        address: info.address,
        preferred: PREFER_HINTS.some((h) => low.indexOf(h) >= 0),
      });
    });
  });
  return out.sort((a, b) => (b.preferred ? 1 : 0) - (a.preferred ? 1 : 0));
}

function buildBaseUrl(port) {
  const cloud = cloudBaseUrl();
  if (cloud) return cloud;
  const list = listLanAddresses();
  return 'http://' + (list.length ? list[0].address : '127.0.0.1') + ':' + port;
}

/** 演示身份：与后端 studentProfiles 的 key 一一对应 */
function demoPersonas(studentProfiles) {
  const all = studentProfiles || {};
  return Object.keys(all).map((k) => {
    const p = all[k];
    return {
      id: parseInt(k, 10),
      name: p.name,
      avatar: p.avatar,
      college: p.college,
      diet: p.diet,
      goal: p.goal,
      allergyList: p.allergyList || [],
      tag: (p.allergyList && p.allergyList.length)
        ? '过敏原：' + p.allergyList.join('、')
        : (p.diet && p.diet !== '无限制' ? p.diet : p.goal),
    };
  });
}

/** 识别当前所在平台（用于给出对应的演示提示） */
function platformName() {
  if (process.env.KOYEB_PUBLIC_DOMAIN || process.env.KOYEB_APP_NAME || process.env.KOYEB_SERVICE_NAME) return 'koyeb';
  if (process.env.RENDER || process.env.RENDER_EXTERNAL_URL) return 'render';
  if (process.env.VERCEL || process.env.VERCEL_URL) return 'vercel';
  if (process.env.PUBLIC_BASE_URL) return 'custom';
  return '';
}

const CLOUD_TIPS = {
  koyeb: [
    '已部署在 Koyeb，嘉宾用任意网络（4G/5G/WiFi）扫码都能打开',
    'Koyeb 免费实例闲置 1 小时会休眠，被唤醒只需约 1-5 秒，基本无感',
    '仍建议演示前 1 分钟自己打开一次，确保实例处于唤醒状态',
    '若打开缓慢：到 Koyeb 控制台确认 Exposed port 与应用监听端口一致',
  ],
  render: [
    '已部署在 Render，嘉宾用任意网络（4G/5G/WiFi）扫码都能打开',
    '免费实例 15 分钟无访问会休眠，冷启动约 30-60 秒，建议提前预热或用监控保活',
    '建议演示前 2 分钟先自己打开一次预热',
  ],
  default: [
    '已部署在云端，嘉宾用任意网络（4G/5G/WiFi）扫码都能打开',
    '若服务会休眠，建议演示前先打开一次预热',
  ],
};

/**
 * 组装演示配置（供 /api/demo/config 与二维码使用）
 * 地址优先级：
 *   ① PUBLIC_BASE_URL（手动指定，最高优先级）
 *   ② 运行期公网地址（内网穿透建立后由 share.js 写入 —— 保证二维码一定是公网地址）
 *   ③ 请求头推导（访问者实际用的域名 —— 国内平台无需任何配置就能正确）
 *   ④ 平台注入变量（KOYEB_PUBLIC_DOMAIN / RENDER_EXTERNAL_URL 等）
 *   ⑤ 局域网 IP（本地演示）
 * @param {number} port 实际监听端口
 * @param {object} studentProfiles 学生数据
 * @param {object} [req] Express 请求（有则启用第③级）
 */
function demoConfig(port, studentProfiles, req) {
  const manual = process.env.PUBLIC_BASE_URL ? normalizeUrl(process.env.PUBLIC_BASE_URL) : null;
  const runtime = manual ? null : getRuntimeBaseUrl();
  const fromReq = (manual || runtime) ? null : baseFromRequest(req);
  const platformUrl = (manual || runtime || fromReq) ? null : cloudBaseUrl();
  const addrs = listLanAddresses();

  const cloud = manual || runtime || fromReq || platformUrl;
  const base = cloud || ('http://' + (addrs.length ? addrs[0].address : '127.0.0.1') + ':' + port);
  // 模式按「地址本身能不能被外网访问」判定，而不是按是否部署在云端：
  // 本地用局域网地址打开投屏页时，必须如实报成局域网，否则会误导用户去投影一个外网扫不开的二维码
  const lan = isPrivateBase(base);
  const source = manual ? 'PUBLIC_BASE_URL'
    : runtime ? '内网穿透'
      : fromReq ? (lan ? '局域网（访问地址）' : '请求域名')
        : platformUrl ? '平台变量'
          : '局域网';
  const platform = platformName();

  return {
    mode: lan ? 'lan' : 'cloud',
    modeLabel: lan ? '局域网' : '云端（公网）' + (platform ? ' · ' + platform : ''),
    baseUrlSource: source,
    platform: platform,
    demoUrl: base + '/demo',
    qrUrl: base + '/api/demo/qr.png',
    projectorUrl: base + '/demo/qr.html',
    adminUrl: base + '/admin',
    apiBase: base,
    port: port,
    addresses: lan ? addrs : [{ name: platform || 'cloud', address: base, preferred: true }],
    lanReady: !lan || addrs.length > 0,
    personas: demoPersonas(studentProfiles),
    tips: lan ? [
      '嘉宾手机需与演示电脑连同一个 WiFi / 热点',
      '想让嘉宾用流量（4G/5G）也能扫？双击仓库根的 start-demo.bat 开启公网隧道，二维码会自动变成公网地址',
      '若手机打不开，先检查 Windows 防火墙是否放行 ' + port + ' 端口（见《演示方案》文档）',
      '手机自带相机或微信「扫一扫」都能直接打开',
    ] : (CLOUD_TIPS[platform] || CLOUD_TIPS.default),
  };
}

module.exports = {
  cloudBaseUrl, platformName, baseFromRequest, listLanAddresses, buildBaseUrl,
  demoConfig, demoPersonas, isPrivateBase, normalizeUrl, validateBaseUrl,
  setRuntimeBaseUrl, getRuntimeBaseUrl,
};
