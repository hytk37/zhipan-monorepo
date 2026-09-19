// ============================================
// 智慧膳系统 · 登录认证路由
// ============================================
const { Router } = require('express');
const router = Router();
const fs = require('fs');
const path = require('path');
const { ADMIN_SECRET_TOKEN } = require('../middleware/auth');

// 管理员账号
const adminAccount = { username: 'admin', password: 'admin123', name: '管理员' };

// 学生账号库
const studentProfiles = require('../models/data').studentProfiles;
const studentAccounts = {};

// ─── token 持久化 ────────────────────────────────
// 之前 token 只存在内存，后端一重启就全部失效，
// 小程序启动时拿旧 token 校验必然 401（控制台报错 + 弹「请先登录」）。
// 这里把已签发的 token 落到 backend/.data/tokens.json，重启后仍然有效。
const TOKEN_DIR = path.join(__dirname, '..', '.data');
const TOKEN_FILE = path.join(TOKEN_DIR, 'tokens.json');

function loadTokens() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return {};
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8')) || {};
  } catch (e) {
    console.warn('[auth] token 文件读取失败，忽略：' + e.message);
    return {};
  }
}

function saveTokens() {
  try {
    if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true });
    const map = {};
    Object.keys(studentAccounts).forEach((k) => {
      if (studentAccounts[k].token) map[k] = studentAccounts[k].token;
    });
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(map, null, 0), 'utf8');
  } catch (e) {
    console.warn('[auth] token 文件写入失败：' + e.message);
  }
}

// 初始化学生账号
(function initAccounts() {
  const defaultPwd = '123456';
  const savedTokens = loadTokens();
  Object.keys(studentProfiles).forEach(function(k) {
    const p = studentProfiles[k];
    studentAccounts[k] = {
      id: p.id, name: p.name, studentId: p.id, college: p.college,
      account: 'stu' + p.id, password: defaultPwd,
      // 复用上次启动已签发的 token，避免重启后小程序被迫重新登录
      token: savedTokens[k] || ''
    };
  });
})();

// 管理员登录
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === adminAccount.username && password === adminAccount.password) {
    res.json({ success: true, token: ADMIN_SECRET_TOKEN, name: adminAccount.name });
  } else {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
  }
});

// 学生登录
router.post('/student/login', (req, res) => {
  const { account, password } = req.body || {};
  let found = null, sid = null;
  for (const k in studentAccounts) {
    const a = studentAccounts[k];
    if ((a.account === account || String(a.studentId) === String(account)) && a.password === password) {
      found = a; sid = k; break;
    }
  }
  if (found) {
    const token = 'stu_token_' + found.studentId + '_' + Date.now();
    found.token = token;
    studentAccounts[sid].token = token;
    saveTokens();   // 落盘，重启后仍然有效
    res.json({
      success: true, token: token, studentId: sid,
      studentInfo: studentProfiles[sid] || {}
    });
  } else {
    res.status(401).json({ success: false, error: '账号或密码错误' });
  }
});

// 验证学生 token
router.get('/student/verify', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  for (const k in studentAccounts) {
    if (studentAccounts[k].token === token) {
      const sid = parseInt(k);
      return res.json({ success: true, studentId: sid, studentInfo: studentProfiles[sid] || {} });
    }
  }
  res.status(401).json({ success: false, error: 'token 无效或已过期' });
});

module.exports = { router, studentAccounts };
