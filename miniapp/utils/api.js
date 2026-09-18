// utils/api.js
// 封装 wx.request，统一处理 API 调用

const app = getApp();

/**
 * 通用请求封装
 * @param {string} url - 相对路径，如 '/api/students'
 * @param {string} method - GET/POST/PUT/DELETE
 * @param {object} data - 请求体
 * @returns {Promise}
 */
function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    const base = app.globalData.apiBase || 'http://localhost:3000';
    wx.request({
      url: base + url,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json',
        'Authorization': wx.getStorageSync('token') ? 'Bearer ' + wx.getStorageSync('token') : ''
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // 未授权，跳转登录
          wx.showToast({ title: '请先登录', icon: 'none' });
          reject({ statusCode: res.statusCode, data: res.data });
        } else {
          reject({ statusCode: res.statusCode, data: res.data });
        }
      },
      fail(err) {
        wx.showToast({ title: '网络异常', icon: 'none' });
        reject(err);
      }
    });
  });
}

// ========== 学生相关 ==========
const studentApi = {
  /** 获取学生信息 */
  getInfo(id) { return request('/api/students/' + id); },
  /** 更新学生信息 */
  updateInfo(id, data) { return request('/api/students/' + id, 'PUT', data); },
  /** 获取今日营养 */
  getTodayNutrition(id) { return request('/api/students/' + id + '/nutrition/today'); },
  /** 获取营养历史 */
  getNutritionHistory(id, days) { return request('/api/students/' + id + '/nutrition/history', 'GET', { days }); },
  /** 打卡 */
  checkin(id, data) { return request('/api/students/' + id + '/checkin', 'POST', data); }
};

// ========== 菜品相关 ==========
const foodApi = {
  /** 获取推荐菜品 */
  getRecommendations(studentId) { return request('/api/recommendations/' + studentId); },
  /** 获取菜品详情 */
  getDetail(foodId) { return request('/api/foods/' + foodId); },
  /** 获取食堂菜品列表 */
  getCanteenFoods(canteenId) { return request('/api/canteens/' + canteenId + '/foods'); },
  /** 搜索菜品 */
  search(keyword) { return request('/api/foods/search', 'GET', { keyword }); }
};

// ========== 厨房管理相关 ==========
const kitchenApi = {
  /** 获取概览数据 */
  getOverview() { return request('/api/kitchen/overview'); },
  /** 获取销量预测 */
  getSalesForecast() { return request('/api/kitchen/sales-forecast'); },
  /** 获取预警信息 */
  getAlerts() { return request('/api/kitchen/alerts'); }
};

// ========== AI 能力相关 ==========
const aiApi = {
  /** AI 配置与用量状态 */
  getStatus() { return request('/api/ai/status'); },
  /** 本周用餐记录（逐日逐餐菜品 + 统计） */
  getWeekMeals(studentId) { return request('/api/ai/week-meals/' + studentId); },
  /** 本周饮食健康分析（AI，含降级兜底） */
  getWeekHealth(studentId, refresh) {
    return request('/api/ai/health/week/' + studentId + (refresh ? '?refresh=1' : ''));
  },
  /** 追问对话 */
  chat(studentId, question, history) { return request('/api/ai/chat', 'POST', { studentId, question, history }); },
  /** 拍照识别一餐 */
  recognizeMeal(studentId, payload) { return request('/api/ai/recognize-meal', 'POST', Object.assign({ studentId }, payload)); },
  /** 手动记一餐 */
  logMeal(studentId, payload) { return request('/api/ai/meal-log', 'POST', Object.assign({ studentId }, payload)); },
  /** 可记餐的菜品候选（已过禁忌过滤） */
  getCandidates(studentId) { return request('/api/ai/candidates/' + studentId); }
};

// ========== 登录相关 ==========
const authApi = {
  /** 学生登录 */
  login(account, password) { return request('/api/student/login', 'POST', { account, password }); },
  /** 验证 token */
  verify() { return request('/api/student/verify'); }
};

module.exports = {
  request,
  get: (url, data) => request(url, 'GET', data),
  post: (url, data) => request(url, 'POST', data),
  put: (url, data) => request(url, 'PUT', data),
  delete: (url, data) => request(url, 'DELETE', data),
  student: studentApi,
  food: foodApi,
  kitchen: kitchenApi,
  ai: aiApi,
  auth: authApi
};
