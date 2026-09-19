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

/** 云端平台注入的公网地址（Render 会自动提供 RENDER_EXTERNAL_URL） */
function cloudBaseUrl() {
  const raw = process.env.PUBLIC_BASE_URL
    || process.env.RENDER_EXTERNAL_URL
    || (process.env.RENDER_EXTERNAL_HOSTNAME ? 'https://' + process.env.RENDER_EXTERNAL_HOSTNAME : '')
    || process.env.VERCEL_URL
    || '';
  if (!raw) return null;
  let url = String(raw).trim().replace(/\/+$/, '');
  if (url.indexOf('http') !== 0) url = 'https://' + url;   // 只给了域名的情况
  return url;
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

/**
 * 组装演示配置（供 /api/demo/config 与二维码使用）
 * @param {number} port 实际监听端口
 */
function demoConfig(port, studentProfiles) {
  const cloud = cloudBaseUrl();
  const addrs = listLanAddresses();
  const base = cloud || ('http://' + (addrs.length ? addrs[0].address : '127.0.0.1') + ':' + port);

  return {
    mode: cloud ? 'cloud' : 'lan',
    modeLabel: cloud ? '云端（公网）' : '局域网',
    demoUrl: base + '/demo',
    qrUrl: base + '/api/demo/qr.png',
    projectorUrl: base + '/demo/qr.html',
    adminUrl: base + '/admin',
    apiBase: base,
    port: port,
    addresses: cloud ? [{ name: 'cloud', address: base, preferred: true }] : addrs,
    lanReady: !!cloud || addrs.length > 0,
    personas: demoPersonas(studentProfiles),
    tips: cloud
      ? [
        '已部署在云端，嘉宾用任意网络（4G/5G/WiFi）扫码都能打开',
        '首次访问若较慢，多为免费实例冷启动（约 30-60 秒），稍等一下即可',
        '建议演示前 2 分钟先自己打开一次预热',
      ]
      : [
        '嘉宾手机需与演示电脑连同一个 WiFi / 热点',
        '若手机打不开，先检查 Windows 防火墙是否放行 ' + port + ' 端口（见《演示方案》文档）',
        '手机自带相机或微信「扫一扫」都能直接打开',
      ],
  };
}

module.exports = { cloudBaseUrl, listLanAddresses, buildBaseUrl, demoConfig, demoPersonas };
