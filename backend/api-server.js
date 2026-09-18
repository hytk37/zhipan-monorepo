// ============================================
// 智慧膳系统 · API Server 入口
// ============================================
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

// ─── 全局中间件 ───────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ─── 静态文件托管：管理后台 ──────────────────────
app.use('/admin', function(req, res, next) {
  const adminDir = path.join(__dirname, '..', 'admin');
  const filePath = path.join(adminDir, req.path === '/' || req.path === '' ? 'index.html' : req.path);
  if (filePath.indexOf(adminDir) !== 0) {
    return res.status(403).send('Forbidden');
  }
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html', '.js': 'application/javascript',
      '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon'
    };
    res.type(mime[ext] || 'application/octet-stream');
    res.send(fs.readFileSync(filePath, ext === '.html' ? 'utf8' : undefined));
  } else {
    const indexFile = path.join(adminDir, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.type('text/html');
      res.send(fs.readFileSync(indexFile, 'utf8'));
    } else {
      res.status(404).send('Not found');
    }
  }
});

// ─── 根路径跳转管理后台 ───────────────────────────
app.get('/', (req, res) => { res.redirect('/admin'); });

// ─── 路由挂载 ─────────────────────────────────────
const overviewRoutes = require('./routes/overview');
const kitchenRoutes = require('./routes/kitchen');
const studentRoutes = require('./routes/student');
const aiRoutes = require('./routes/ai');
const { router: authRoutes } = require('./routes/auth');
const adminRoutes = require('./routes/admin');

app.use('/api', overviewRoutes);
app.use('/api', kitchenRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api', studentRoutes);
app.use('/api', aiRoutes);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);

// ─── API 404 兜底（返回 JSON 而非 HTML）───────────
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在: ' + req.method + ' ' + req.originalUrl,
  });
});

// ─── 统一错误处理（避免把堆栈以 HTML 返回给前端）──
app.use((err, req, res, next) => {
  console.error('[API Error]', req.method, req.originalUrl, '-', err.message);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ success: false, error: err.message || '服务器内部错误' });
});

// ─── 启动服务器（仅直接运行时监听；被 require 时只导出 app，便于测试）──
function startServer(port) {
  const PORT = (port === 0 || port) ? port : (parseInt(process.env.PORT, 10) || 3000);
  const server = app.listen(PORT, '0.0.0.0');

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('[启动失败] 端口 ' + PORT + ' 已被占用。请关闭占用进程，或指定其他端口：PORT=3001 node api-server.js');
      process.exit(1);
    }
    throw err;
  });

  server.on('listening', () => {
    const actual = (server.address() && server.address().port) || PORT;
    console.log('');
    console.log('  智慧膳系统 · API Server 已启动 (v2.1)');
    console.log('  ------------------------------------------------');
    console.log('  地址:      http://localhost:' + actual + (actual === 3000 ? '  (局域网可用)' : ''));
    console.log('  admin:     http://localhost:' + actual + '/admin');
    console.log('  login:     admin / admin123');
    console.log('  ------------------------------------------------');
    console.log('  routes/overview.js  数据概览   5 个接口');
    console.log('  routes/kitchen.js   后厨管理  10 个接口  (/api 与 /api/kitchen)');
    console.log('  routes/student.js   学生业务  12 个接口');
    console.log('  routes/ai.js        AI 能力    7 个接口  (周健康分析 / 追问 / 拍照识别)');
    console.log('  routes/auth.js      登录认证   3 个接口');
    console.log('  routes/admin.js     管理员     2 个接口  (需认证)');
    console.log('  ------------------------------------------------');
    try {
      const { describe } = require('./config/deepseek');
      const d = describe();
      console.log('  AI: ' + (d.configured
        ? '已启用  ' + d.models.flash + ' / ' + d.models.pro
        : '未配置 Key（接口走规则模板降级，功能仍可用）'));
    } catch (e) {
      console.log('  AI: 配置读取失败 - ' + e.message);
    }
    console.log('');
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
