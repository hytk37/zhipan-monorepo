// ============================================
// 智慧膳系统 · 登录认证路由
// ============================================
const { Router } = require('express');
const router = Router();
const { ADMIN_SECRET_TOKEN } = require('../middleware/auth');

// 管理员账号
const adminAccount = { username: 'admin', password: 'admin123', name: '管理员' };

// 学生账号库
const studentProfiles = require('../models/data').studentProfiles;
const studentAccounts = {};

// 初始化学生账号
(function initAccounts() {
  const defaultPwd = '123456';
  Object.keys(studentProfiles).forEach(function(k) {
    const p = studentProfiles[k];
    studentAccounts[k] = {
      id: p.id, name: p.name, studentId: p.id, college: p.college,
      account: 'stu' + p.id, password: defaultPwd, token: ''
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
