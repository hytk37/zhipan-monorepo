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
    // 如果有 token，静默验证；通过则直接进首页，不通过就安静地清掉
    // （校验失败不弹提示：启动时的旧 token 失效属于正常情况）
    const token = wx.getStorageSync('token');
    if (!token) return;

    api.auth.verify({ silent: true }).then(function(res) {
      if (res && res.success) {
        app.globalData.currentStudentId = res.studentId;
        if (res.studentInfo) wx.setStorageSync('studentInfo', res.studentInfo);
        wx.switchTab({ url: '/pages/index/index' });
      } else {
        wx.removeStorageSync('token');
        wx.removeStorageSync('studentInfo');
      }
    }.bind(this)).catch(function(err) {
      // 只有明确「token 无效」（401）才清登录态；
      // 网络异常（后端未启动/断网）时保留 token，下次启动再试，
      // 避免后端没开就把用户登出。
      if (err && err.statusCode === 401) {
        wx.removeStorageSync('token');
        wx.removeStorageSync('studentInfo');
      }
    });
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
