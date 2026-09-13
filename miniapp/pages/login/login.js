// pages/login/login.js
const api = require('../../utils/api');
const app = getApp();

Page({
  data: {
    account: '',
    password: '',
    showPwd: false,
    loading: false,
    errorMsg: ''
  },

  onLoad() {
    // 如果有 token，自动验证后跳转首页
    const token = wx.getStorageSync('token');
    if (token) {
      api.auth.verify().then(function(res) {
        if (res.success) {
          app.globalData.currentStudentId = res.studentId;
          wx.switchTab({ url: '/pages/index/index' });
        }
      }.bind(this)).catch(function() {
        wx.removeStorageSync('token');
      });
    }
  },

  onAccountInput(e) {
    this.setData({ account: e.detail.value, errorMsg: '' });
  },

  onPwdInput(e) {
    this.setData({ password: e.detail.value, errorMsg: '' });
  },

  togglePwd() {
    this.setData({ showPwd: !this.data.showPwd });
  },

  handleLogin() {
    const { account, password } = this.data;
    if (!account.trim()) {
      this.setData({ errorMsg: '请输入账号' });
      return;
    }
    if (!password.trim()) {
      this.setData({ errorMsg: '请输入密码' });
      return;
    }

    this.setData({ loading: true, errorMsg: '' });

    api.auth.login(account, password).then(function(res) {
      if (res.success) {
        // 保存 token
        wx.setStorageSync('token', res.token);
        // 保存学生信息
        if (res.studentInfo) {
          wx.setStorageSync('studentInfo', res.studentInfo);
        }
        app.globalData.currentStudentId = parseInt(res.studentId);
        // 跳转首页
        wx.switchTab({ url: '/pages/index/index' });
      } else {
        this.setData({
          errorMsg: res.error || '登录失败，请检查账号密码',
          loading: false
        });
      }
    }.bind(this)).catch(function(err) {
      var msg = '网络连接失败';
      if (err && err.data && err.data.error) msg = err.data.error;
      this.setData({ errorMsg: msg, loading: false });
    }.bind(this));
  }
});
