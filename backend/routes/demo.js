// ============================================
// 智慧膳系统 · 演示模式路由
// ============================================
// GET /api/demo/config     演示配置（体验链接、局域网地址、体验身份列表）
// GET /api/demo/qr.png     体验页二维码（PNG，可直接截图/投影）
// GET /api/demo/qr.svg     同上，矢量版（放大投影更清晰）
// GET /api/demo/qr-dataurl 二维码 base64（给前端直接 <img src> 用）

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

router.get('/demo/config', (req, res) => {
  res.json(demoInfo.demoConfig(currentPort(req), studentProfiles, req));
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
  try {
    const buf = await QRCode.toBuffer(cfg.demoUrl, {
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
  try {
    const svg = await QRCode.toString(cfg.demoUrl, {
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
    const url = await QRCode.toDataURL(cfg.demoUrl, {
      width: 480, margin: 2, errorCorrectionLevel: 'M',
      color: { dark: '#0B1B33', light: '#FFFFFF' },
    });
    res.json({ demoUrl: cfg.demoUrl, dataUrl: url });
  } catch (e) {
    res.status(500).json({ error: '二维码生成失败：' + e.message });
  }
});

module.exports = router;
