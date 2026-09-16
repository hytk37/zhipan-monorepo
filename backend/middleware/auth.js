// ============================================
// 智慧膳系统 · 认证中间件
// ============================================

const ADMIN_SECRET_TOKEN = 'admin_token_fixed_2026_hx_smart_plate';

/**
 * 管理员认证中间件
 * 验证 Bearer token 是否为固定的管理员密钥
 */
function requireAdmin(req, res, next) {
  const token = req.headers.authorization || '';
  if (token === 'Bearer ' + ADMIN_SECRET_TOKEN || token === ADMIN_SECRET_TOKEN) {
    next();
  } else {
    res.status(401).json({ success: false, error: '未授权，请重新登录' });
  }
}

module.exports = { requireAdmin, ADMIN_SECRET_TOKEN };
