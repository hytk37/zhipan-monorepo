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

/** 统一成 https://域名（去掉尾部斜杠、补协议） */
function normalizeUrl(raw) {
  let url = String(raw || '').trim().replace(/\/+$/, '');
  if (!url) return null;
  if (url.indexOf('http') !== 0) url = 'https://' + url;
  return url;
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
 *   ② 请求头推导（访问者实际用的域名 —— 国内平台无需任何配置就能正确）
 *   ③ 平台注入变量（KOYEB_PUBLIC_DOMAIN / RENDER_EXTERNAL_URL 等）
 *   ④ 局域网 IP（本地演示）
 * @param {number} port 实际监听端口
 * @param {object} studentProfiles 学生数据
 * @param {object} [req] Express 请求（有则启用第②级）
 */
function demoConfig(port, studentProfiles, req) {
  const manual = process.env.PUBLIC_BASE_URL ? normalizeUrl(process.env.PUBLIC_BASE_URL) : null;
  const fromReq = manual ? null : baseFromRequest(req);
  const platformUrl = (manual || fromReq) ? null : cloudBaseUrl();
  const addrs = listLanAddresses();

  const cloud = manual || fromReq || platformUrl;
  const base = cloud || ('http://' + (addrs.length ? addrs[0].address : '127.0.0.1') + ':' + port);
  const source = manual ? 'PUBLIC_BASE_URL'
    : fromReq ? '请求域名'
      : platformUrl ? '平台变量'
        : '局域网';
  const platform = platformName();

  return {
    mode: cloud ? 'cloud' : 'lan',
    modeLabel: cloud ? '云端（公网）' + (platform ? ' · ' + platform : '') : '局域网',
    baseUrlSource: source,
    platform: platform,
    demoUrl: base + '/demo',
    qrUrl: base + '/api/demo/qr.png',
    projectorUrl: base + '/demo/qr.html',
    adminUrl: base + '/admin',
    apiBase: base,
    port: port,
    addresses: cloud ? [{ name: platform || 'cloud', address: base, preferred: true }] : addrs,
    lanReady: !!cloud || addrs.length > 0,
    personas: demoPersonas(studentProfiles),
    tips: cloud ? (CLOUD_TIPS[platform] || CLOUD_TIPS.default) : [
      '嘉宾手机需与演示电脑连同一个 WiFi / 热点',
      '若手机打不开，先检查 Windows 防火墙是否放行 ' + port + ' 端口（见《演示方案》文档）',
      '手机自带相机或微信「扫一扫」都能直接打开',
    ],
  };
}

module.exports = { cloudBaseUrl, platformName, baseFromRequest, listLanAddresses, buildBaseUrl, demoConfig, demoPersonas };
