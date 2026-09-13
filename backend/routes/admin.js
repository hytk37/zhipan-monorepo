// ============================================
// HX系统 · 管理员路由
// ============================================
const { Router } = require('express');
const router = Router();
const { requireAdmin } = require('../middleware/auth');
const {
  studentProfiles, students, todayNutritionStore,
} = require('../models/data');
const { studentAccounts } = require('./auth');

let nextStudentId = 100;

// 批量导入学生
router.post('/students/batch', requireAdmin, (req, res) => {
  const studentsList = req.body.students || req.body || [];
  if (!Array.isArray(studentsList) || studentsList.length === 0) {
    return res.status(400).json({ success: false, error: '请提供有效的学生数据' });
  }
  const added = [];
  studentsList.forEach(function(s) {
    const sid = nextStudentId++;
    const studentId = parseInt(s.id || s.studentId || ('2023' + String(sid).padStart(5, '0')));
    const defaultPwd = s.password || '123456';
    const account = s.account || ('stu' + studentId);

    studentProfiles[sid] = {
      id: studentId, name: s.name || '未知', college: s.college || '',
      avatar: '🧑🏻', diet: '无限制', gender: s.gender || '未知', age: parseInt(s.age) || 18,
      height: parseInt(s.height) || 170, weight: parseInt(s.weight) || 60,
      bmi: 0, goal: '均衡饮食', level: 1, checkDays: 0, avgScore: 0,
      allergyList: s.allergyList || []
    };
    if (studentProfiles[sid].height && studentProfiles[sid].weight) {
      const h = studentProfiles[sid].height / 100;
      studentProfiles[sid].bmi = parseFloat((studentProfiles[sid].weight / (h * h)).toFixed(1));
    }

    todayNutritionStore[sid] = {
      calories: 0, caloriesTarget: 2200, protein: 0, proteinTarget: 65,
      carbs: 0, carbsTarget: 280, fat: 0, fatTarget: 60,
      fiber: 0, fiberTarget: 25, score: 0, checked: false, goalType: '均衡饮食'
    };

    studentAccounts[sid] = {
      id: studentId, name: s.name || '未知', studentId: studentId,
      college: s.college || '', account: account, password: defaultPwd, token: ''
    };

    students.push({
      id: studentId, name: s.name || '未知', gender: s.gender || '未知',
      age: parseInt(s.age) || 18, cardNo: account
    });

    added.push({ account: account, password: defaultPwd, studentId: studentId, name: s.name || '未知' });
  });

  res.json({ success: true, count: added.length, students: added });
});

// 获取所有学生账号列表
router.get('/students', requireAdmin, (req, res) => {
  const list = Object.values(studentAccounts).map(function(a) {
    return {
      account: a.account, password: a.password,
      studentId: a.studentId, name: a.name, college: a.college
    };
  });
  res.json({ success: true, count: list.length, list: list });
});

module.exports = router;
