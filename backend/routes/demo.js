// ============================================
// 智慧膳系统 · 演示模式路由
// ============================================
// GET /api/demo/config     演示配置（体验链接、管理后台链接、局域网地址、体验身份列表）
// GET /api/demo/qr.png     二维码（PNG，可直接截图/投影）
// GET /api/demo/qr.svg     同上，矢量版（放大投影更清晰）
// GET /api/demo/qr-dataurl 两个二维码的 base64（学生端 + 管理后台，给前端直接 <img src> 用）
//
// 二维码指向哪里用 ?target= 指定：
//   ?target=demo   （默认）学生端体验页 /demo
//   ?target=admin          管理后台大屏 /admin
// 例：/api/demo/qr.png?size=720&target=admin
//
// GET    /api/demo/base-url  读取当前公网地址（也用于服务版本能力探测，全局可用）
// POST   /api/demo/base-url  写入当前公网地址（仅本机可调，内网穿透脚本用）
// DELETE /api/demo/base-url  清除

const { Router } = require('express');
const router = Router();
const QRCode = require('qrcode');
const demoInfo = require('../services/demoInfo');
const { studentProfiles } = require('../models/data');

function currentPort(req) {
  // 优先取实际监听端口（请求 Host 里带的端口），拿不到再回退 3000
  const host = req.headers.host || '';
  const m = host.match(/:(\d+)$/);
  return m ? parseInt(m[1], 10) : (parseInt(process.env.PORT, 10) || 3000);
}

/**
 * 二维码要指向哪个地址
 *   ?target=demo  （默认）学生端体验页 /demo
 *   ?target=admin        管理后台大屏 /admin
 * 只允许这两个取值，避免被当成任意跳转的二维码生成器。
 */
function qrTarget(req, cfg) {
  const t = String(req.query.target || 'demo').toLowerCase();
  if (t === 'admin' || t === 'manage' || t === 'backend' || t === '大屏') {
    return { url: cfg.adminUrl, kind: 'admin' };
  }
  return { url: cfg.demoUrl, kind: 'demo' };
}

router.get('/demo/config', (req, res) => {
  res.json(demoInfo.demoConfig(currentPort(req), studentProfiles, req));
});

// ─── 运行期公网地址（内网穿透用）──────────────────────────
// 只接受「本机直连」的调用（share.js 用 127.0.0.1 调）：
//   · 来源必须是回环地址
//   · 且不能带 x-forwarded-* 头（云托管/隧道转发过来的请求会带，一律拒绝）
function fromLocalhostOnly(req, res) {
  const ip = String((req.socket && req.socket.remoteAddress) || req.ip || '');
  const loopback = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  const forwarded = !!(req.headers['x-forwarded-for'] || req.headers['x-forwarded-host']);
  if (!loopback || forwarded) {
    res.status(403).json({
      ok: false, error: 'local_only',
      hint: '该接口仅供本机的一键演示脚本（start-demo.bat / npm run share）调用',
    });
    return false;
  }
  return true;
}

// 读取当前运行期公网地址（同时用作「服务版本能力探测」：
// 旧版本服务没有这个路由，会返回 404，share.js 据此避免复用旧服务）
router.get('/demo/base-url', (req, res) => {
  res.json({ ok: true, url: demoInfo.getRuntimeBaseUrl() });
});

// 写入当前公网地址（内网穿透建立后由 share.js 调用）
router.post('/demo/base-url', (req, res) => {
  if (!fromLocalhostOnly(req, res)) return;
  const url = demoInfo.setRuntimeBaseUrl(req.body && req.body.url);
  if (!url) {
    return res.status(400).json({ ok: false, error: 'invalid_url', hint: '请传 { url: "https://xxx.trycloudflare.com" }' });
  }
  res.json({ ok: true, baseUrl: url });
});

// 清除（隧道关闭时调用，避免二维码还指向已失效的地址）
router.delete('/demo/base-url', (req, res) => {
  if (!fromLocalhostOnly(req, res)) return;
  demoInfo.setRuntimeBaseUrl(null);
  res.json({ ok: true, cleared: true });
});

// 健康检查 / 保活（Koyeb / CloudBase 健康检查路径；也可用外部监控定时访问防止休眠）
router.get('/demo/ping', (req, res) => {
  // 与 /api/demo/config 用同一套地址判断逻辑，避免两者报告的运行模式不一致
  const cfg = demoInfo.demoConfig(currentPort(req), studentProfiles, req);
  res.json({
    ok: true,
    service: '智慧膳系统 · 演示环境',
    mode: cfg.mode,
    modeLabel: cfg.modeLabel,
    baseUrlSource: cfg.baseUrlSource,
    time: new Date().toISOString(),
  });
});

router.get('/demo/qr.png', async (req, res) => {
  const cfg = demoInfo.demoConfig(currentPort(req), studentProfiles, req);
  const size = Math.min(Math.max(parseInt(req.query.size, 10) || 480, 120), 1200);
  const target = qrTarget(req, cfg);
  try {
    const buf = await QRCode.toBuffer(target.url, {
      type: 'png',
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0B1B33', light: '#FFFFFF' },
    });
    res.type('image/png');
    // 演示期间不缓存，方便换网络后重新扫码
    res.set('Cache-Control', 'no-store');
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: '二维码生成失败：' + e.message });
  }
});

router.get('/demo/qr.svg', async (req, res) => {
  const cfg = demoInfo.demoConfig(currentPort(req), studentProfiles, req);
  const target = qrTarget(req, cfg);
  try {
    const svg = await QRCode.toString(target.url, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0B1B33', light: '#FFFFFF' },
    });
    res.type('image/svg+xml');
    res.set('Cache-Control', 'no-store');
    res.send(svg);
  } catch (e) {
    res.status(500).json({ error: '二维码生成失败：' + e.message });
  }
});

router.get('/demo/qr-dataurl', async (req, res) => {
  const cfg = demoInfo.demoConfig(currentPort(req), studentProfiles, req);
  try {
    const opts = {
      width: 480, margin: 2, errorCorrectionLevel: 'M',
      color: { dark: '#0B1B33', light: '#FFFFFF' },
    };
    const demoDataUrl = await QRCode.toDataURL(cfg.demoUrl, opts);
    const adminDataUrl = await QRCode.toDataURL(cfg.adminUrl, opts);
    res.json({
      demoUrl: cfg.demoUrl,
      adminUrl: cfg.adminUrl,
      dataUrl: demoDataUrl,          // 兼容旧调用（= 学生端）
      adminDataUrl: adminDataUrl,
    });
  } catch (e) {
    res.status(500).json({ error: '二维码生成失败：' + e.message });
  }
});

module.exports = router;
