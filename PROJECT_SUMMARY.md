# 智盘 (HX系统) 项目综合文档

> **项目名称**：高校智慧食堂营养分析与AI推荐系统  
> **技术架构**：Monorepo 全栈工程  
> **工作空间**：`D:\project\v3\zhipan-monorepo\`  
> **文档生成时间**：2026-06-07

---

## 📋 目录

1. [项目概述](#overview)
2. [技术栈](#tech-stack)
3. [项目结构](#structure)
4. [后端API服务](#backend)
5. [管理后台](#admin)
6. [微信小程序](#miniapp)
7. [数据模型](#data-model)
8. [API接口文档](#api-docs)
9. [启动指南](#startup)
10. [关键文件清单](#file-list)

---

<a name="overview"></a>
## 项目概述

**智盘 (HX系统)** 是一套面向高校的智慧食堂解决方案，包含：

- **营养分析**：基于学生餐饮数据的营养摄入分析
- **AI推荐**：个性化菜品推荐系统
- **后厨管理**：销量预测、采购建议、菜品优化
- **游戏化激励**：营养闯关游戏提升学生参与度

**核心用户**：
- 学生：查看营养分析、获取推荐、记录餐饮
- 后厨人员：查看销量数据、接收采购建议
- 管理员：系统配置、数据管理

---

<a name="tech-stack"></a>
## 技术栈

| 模块 | 技术栈 | 说明 |
|------|--------|------|
| **后端API** | Node.js + Express | RESTful API，分层架构 |
| **管理后台** | HTML + CSS + JavaScript | 单文件应用，Chart.js可视化 |
| **微信小程序** | 微信原生框架 | 50+文件，自定义组件 |
| **数据存储** | 内存Mock | 规划迁移至SQLite |
| **认证方式** | Bearer Token | 规划升级至JWT + bcrypt |
| **可视化** | Chart.js 4.4 | 管理后台图表库 |

---

<a name="structure"></a>
## 项目结构

```
zhipan-monorepo/
├── backend/                      ← Node.js + Express API 服务
│   ├── api-server.js             ← API入口文件 (Express应用)
│   ├── routes/                   ← 路由模块(5个)
│   │   ├── overview.js           ← 数据概览路由 (7个API)
│   │   ├── kitchen.js            ← 后厨管理路由 (10个API)
│   │   ├── student.js            ← 学生业务路由 (12个API)
│   │   ├── auth.js               ← 登录认证路由 (3个API)
│   │   └── admin.js              ← 管理员路由 (2个API)
│   ├── middleware/               ← 中间件
│   │   └── auth.js               ← 认证中间件 (Bearer Token验证)
│   ├── models/                   ← 数据模型
│   │   └── data.js               ← Mock数据 (学生、营养、后厨等)
│   ├── package.json              ← 后端依赖配置
│   └── README.md                 ← 后端说明文档
│
├── admin/                        ← 管理后台(单文件应用)
│   └── index.html                ← 完整管理后台 (109KB, Chart.js + 暗色主题)
│
├── miniapp/                      ← 微信小程序(50+文件)
│   ├── app.js                    ← 小程序入口逻辑
│   ├── app.json                  ← 小程序全局配置
│   ├── app.wxss                  ← 小程序全局样式
│   ├── custom-tab-bar/           ← 自定义Tab栏组件
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   ├── pages/                    ← 小程序页面(9个)
│   │   ├── login/                ← 登录页
│   │   ├── index/                ← 首页(营养+打卡+推荐)
│   │   ├── meals/                ← 记录页
│   │   ├── recommend/            ← 推荐页
│   │   ├── profile/              ← 我的页
│   │   ├── game/                 ← 冒险页(游戏化闯关)
│   │   ├── settings/             ← 设置页
│   │   ├── nutrition-detail/     ← 营养详情页
│   │   └── food-detail/          ← 菜品详情页
│   ├── utils/                    ← 工具函数
│   ├── project.config.json        ← 小程序项目配置
│   └── README.md                 ← 小程序说明文档
│
└── README.md                     ← 项目总说明文档
```

---

<a name="backend"></a>
## 后端API服务

### 入口文件：`backend/api-server.js`

**功能**：
- 创建Express应用
- 配置中间件 (CORS, JSON解析, 静态文件)
- 注册路由 (auth, overview, kitchen, student, admin)
- 启动HTTP服务器 (端口3000)

**关键代码**：
```javascript
const express = require('express');
const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../admin')));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/overview', require('./routes/overview'));
app.use('/api/kitchen', require('./routes/kitchen'));
app.use('/api/student', require('./routes/student'));
app.use('/api/admin', require('./routes/admin'));

app.listen(PORT, () => {
  console.log(`API服务器运行在 http://localhost:${PORT}`);
});
```

### 路由模块

#### 1. `routes/overview.js` - 数据概览路由

**API接口**：
- `GET /api/overview/students` - 获取学生列表
- `GET /api/overview/student/:id/nutrition` - 获取学生营养数据
- `GET /api/overview/kitchen/kpi` - 获取后厨KPI
- `GET /api/overview/kitchen/group-radar` - 获取群体营养雷达图
- `GET /api/overview/kitchen/heatmap` - 获取销量热力图
- `GET /api/overview/kitchen/forecast` - 获取LSTM销量预测
- `GET /api/overview/kitchen/purchase` - 获取采购建议
- `GET /api/overview/kitchen/new-dishes` - 获取菜品上新建议
- `GET /api/overview/overview/fiber-dist` - 获取膳食纤维分布
- `GET /api/overview/overview/monthly-trend` - 获取30日趋势
- `GET /api/overview/overview/system-status` - 获取系统状态

**示例路由**：
```javascript
// 学生列表
router.get('/students', (req, res) => {
  res.json(students.map(({ id, name, gender, age }) => ({ id, name, gender, age })));
});

// 单个学生营养数据
router.get('/student/:id/nutrition', (req, res) => {
  const id = parseInt(req.params.id);
  const data = nutritionData[id];
  if (data) res.json(data);
  else res.status(404).json({ error: 'Student not found' });
});
```

#### 2. `routes/kitchen.js` - 后厨管理路由 (10个API)
#### 3. `routes/student.js` - 学生业务路由 (12个API)
#### 4. `routes/auth.js` - 登录认证路由 (3个API)
#### 5. `routes/admin.js` - 管理员路由 (2个API，需认证)

### 中间件：`middleware/auth.js`

**功能**：验证Bearer Token认证

**代码**：
```javascript
module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  // 简化验证：检查token是否存在于mockTokens中
  const isValid = mockTokens.some(t => t.token === token);
  if (!isValid) return res.sendStatus(403);
  
  next();
};
```

---

<a name="admin"></a>
## 管理后台

### 文件：`admin/index.html` (109KB)

**技术特点**：
- 单文件应用 (HTML + CSS + JavaScript)
- Chart.js 4.4 数据可视化
- CSS Variables 暗色主题
- 响应式布局

**主要功能模块**：
1. **登录页面** - 管理员登录 (admin/admin123)
2. **数据概览** - 学生营养数据、趋势图表
3. **后厨管理** - KPI、热力图、预测、采购建议
4. **学生管理** - 学生列表、营养详情

**核心代码结构**：
```javascript
// 登录验证
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (username === 'admin' && password === 'admin123') {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    loadDashboard();
  } else {
    alert('用户名或密码错误');
  }
}

// 加载仪表盘
async function loadDashboard() {
  const response = await fetch(`${API_BASE}/overview/students`);
  const students = await response.json();
  // 渲染图表...
}
```

**CSS主题变量**：
```css
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #0f3460;
  --text-primary: #e4e6eb;
  --text-secondary: #b0b3b8;
  --accent: #00d4ff;
  --success: #00ff88;
  --warning: #ffa502;
  --danger: #ff4757;
}
```

---

<a name="miniapp"></a>
## 微信小程序

### 全局配置：`miniapp/app.json`

**页面路径**：
```json
{
  "pages": [
    "pages/login/login",
    "pages/index/index",
    "pages/meals/meals",
    "pages/recommend/recommend",
    "pages/profile/profile",
    "pages/nutrition-detail/nutrition-detail",
    "pages/food-detail/food-detail",
    "pages/settings/settings",
    "pages/game/game"
  ]
}
```

**TabBar配置** (自定义)：
```json
{
  "tabBar": {
    "custom": true,
    "color": "#999999",
    "selectedColor": "#07C160",
    "backgroundColor": "#ffffff",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页" },
      { "pagePath": "pages/meals/meals", "text": "记录" },
      { "pagePath": "pages/recommend/recommend", "text": "推荐" },
      { "pagePath": "pages/profile/profile", "text": "我的" }
    ]
  }
}
```

### 小程序入口：`miniapp/app.js`

**核心功能**：
- 小程序初始化
- 登录状态管理
- 全局数据管理

**代码结构**：
```javascript
App({
  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },
  
  globalData: {
    userInfo: null,
    apiBase: 'http://localhost:3000/api'
  }
});
```

### 页面结构

#### 1. 登录页 `pages/login/login`
- 学号/手机号登录
- 密码验证
- 跳转首页

#### 2. 首页 `pages/index/index`
- 今日营养摄入概览
- 打卡状态
- 推荐菜品展示

#### 3. 记录页 `pages/meals/meals`
- 餐饮记录列表
- 日期筛选

#### 4. 推荐页 `pages/recommend/recommend`
- AI推荐菜品
- 推荐理由

#### 5. 我的页 `pages/profile/profile`
- 个人信息
- 营养报告入口
- 设置入口

#### 6. 游戏页 `pages/game/game`
- 营养闯关游戏
- 奖励机制

#### 7. 设置页 `pages/settings/settings`
- 个人信息设置
- 通知设置

#### 8. 营养详情页 `pages/nutrition-detail/nutrition-detail`
- 详细营养分析
- 各项指标图表

#### 9. 菜品详情页 `pages/food-detail/food-detail`
- 菜品营养信息
- 食材组成

### 自定义TabBar：`custom-tab-bar/`

**文件**：
- `index.js` - TabBar逻辑
- `index.json` - 组件配置
- `index.wxml` - TabBar模板
- `index.wxss` - TabBar样式

---

<a name="data-model"></a>
## 数据模型

### 文件：`backend/models/data.js`

**Mock数据包含**：

#### 1. 学生数据 `students`
```javascript
[
  {
    id: 1,
    cardNumber: '2023010042',
    name: '张三',
    gender: '男',
    age: 20,
    password: '123456'
  },
  // ... 更多学生
]
```

#### 2. 营养数据 `nutritionData`
```javascript
{
  1: {  // 学生ID
    calories: { current: 2850, target: 2150, status: '超标', percentage: 132 },
    protein: { current: 85, target: 75, status: '达标', percentage: 113 },
    fat: { current: 95, target: 70, status: '超标', percentage: 135 },
    fiber: { current: 18, target: 25, status: '不足', percentage: 72 },
    barData: { labels: [...], values: [...] },
    weeklyCalories: { labels: [...], values: [...] },
    meals: { '2026-03-15': { breakfast: [...], lunch: [...] } },
    alerts: [...],
    recommendations: [...]
  }
}
```

#### 3. 后厨数据
- `kitchenKPI` - 后厨KPI指标
- `groupRadar` - 群体营养雷达图数据
- `heatmapData` - 销量热力图数据
- `forecastData` - LSTM销量预测数据
- `purchaseData` - 采购建议数据
- `newDishData` - 菜品上新建议数据

#### 4. 其他数据
- `fiberDist` - 膳食纤维分布
- `monthlyTrend` - 30日趋势
- `systemStatus` - 系统状态

---

<a name="api-docs"></a>
## API接口文档

### 认证相关 `POST /api/auth`

| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/login` | POST | 用户登录 | `{ username, password }` |
| `/logout` | POST | 用户登出 | - |
| `/refresh` | POST | 刷新Token | `{ token }` |

### 数据概览 `GET /api/overview`

| 接口 | 方法 | 描述 | 参数 |
|------|------|------|------|
| `/students` | GET | 学生列表 | - |
| `/student/:id/nutrition` | GET | 学生营养数据 | `id` (路径参数) |
| `/kitchen/kpi` | GET | 后厨KPI | - |
| `/kitchen/group-radar` | GET | 群体营养雷达图 | - |
| `/kitchen/heatmap` | GET | 销量热力图 | - |
| `/kitchen/forecast` | GET | LSTM销量预测 | - |
| `/kitchen/purchase` | GET | 采购建议 | - |
| `/kitchen/new-dishes` | GET | 菜品上新建议 | - |
| `/overview/fiber-dist` | GET | 膳食纤维分布 | - |
| `/overview/monthly-trend` | GET | 30日趋势 | - |
| `/overview/system-status` | GET | 系统状态 | - |

### 后厨管理 `GET/POST /api/kitchen` (10个接口)
### 学生业务 `GET/POST /api/student` (12个接口)
### 管理员 `GET/POST /api/admin` (2个接口，需认证)

---

<a name="startup"></a>
## 启动指南

### 1. 启动后端API服务

```bash
cd D:\project\v3\zhipan-monorepo\backend
npm install          # 首次安装依赖
node api-server.js   # 启动API服务器
```

**访问地址**：`http://localhost:3000`

### 2. 打开管理后台

浏览器访问：**http://localhost:3000/admin**

**登录账号**：
- 用户名：`admin`
- 密码：`admin123`

### 3. 启动微信小程序

1. 打开**微信开发者工具**
2. 选择**导入项目**
3. 项目目录选择：`D:\project\v3\zhipan-monorepo\miniapp`
4. AppID：`wxe4c5c2ae90bb55e0` (测试号)
5. 点击**编译**运行

**学生登录账号**：
- 学号：`stu2023010042` (或 `2023010042`)
- 密码：`123456`

---

<a name="file-list"></a>
## 关键文件清单

### 后端核心文件

| 文件路径 | 大小 | 说明 |
|----------|------|------|
| `backend/api-server.js` | ~3KB | API服务器入口 |
| `backend/routes/overview.js` | ~2KB | 数据概览路由 |
| `backend/routes/kitchen.js` | ~3KB | 后厨管理路由 |
| `backend/routes/student.js` | ~4KB | 学生业务路由 |
| `backend/routes/auth.js` | ~1KB | 认证路由 |
| `backend/routes/admin.js` | ~1KB | 管理员路由 |
| `backend/middleware/auth.js` | ~1KB | 认证中间件 |
| `backend/models/data.js` | ~15KB | Mock数据模型 |

### 管理后台文件

| 文件路径 | 大小 | 说明 |
|----------|------|------|
| `admin/index.html` | ~109KB | 管理后台单文件应用 |

### 小程序核心文件

| 文件路径 | 说明 |
|----------|------|
| `miniapp/app.js` | 小程序入口逻辑 |
| `miniapp/app.json` | 小程序全局配置 |
| `miniapp/app.wxss` | 小程序全局样式 |
| `miniapp/custom-tab-bar/index.js` | 自定义TabBar逻辑 |
| `miniapp/custom-tab-bar/index.wxml` | 自定义TabBar模板 |
| `miniapp/custom-tab-bar/index.wxss` | 自定义TabBar样式 |
| `miniapp/pages/login/login.js` | 登录页逻辑 |
| `miniapp/pages/login/login.wxml` | 登录页模板 |
| `miniapp/pages/index/index.js` | 首页逻辑 |
| `miniapp/pages/index/index.wxml` | 首页模板 |
| `miniapp/pages/meals/meals.js` | 记录页逻辑 |
| `miniapp/pages/recommend/recommend.js` | 推荐页逻辑 |
| `miniapp/pages/profile/profile.js` | 我的页逻辑 |
| `miniapp/pages/game/game.js` | 游戏页逻辑 |

---

## 开发路线图

### 已完成 ✅
- [x] 项目初始化 (Monorepo结构)
- [x] 后端API框架搭建 (Express + 5个路由模块)
- [x] Mock数据模型设计 (学生、营养、后厨)
- [x] 管理后台单文件应用 (Chart.js + 暗色主题)
- [x] 微信小程序框架搭建 (9个页面)
- [x] 自定义TabBar组件
- [x] 认证中间件 (Bearer Token)

### 进行中 🚧
- [ ] 后端数据存储迁移 (内存 → SQLite)
- [ ] 认证系统升级 (Bearer Token → JWT + bcrypt)
- [ ] 小程序页面完善 (所有页面)
- [ ] AI推荐算法实现

### 规划中 📋
- [ ] 后厨管理功能完整实现
- [ ] 营养分析算法优化
- [ ] 游戏化功能完善
- [ ] 数据可视化大屏
- [ ] 多角色权限管理
- [ ] 微信支付集成
- [ ] 消息推送系统

---

## 技术债务与优化建议

### 1. 数据存储
- **当前**：内存Mock数据，重启丢失
- **建议**：迁移至SQLite或MySQL，实现数据持久化

### 2. 认证安全
- **当前**：Bearer Token简单验证，无过期机制
- **建议**：升级至JWT + bcrypt，支持Token刷新、黑名单

### 3. 错误处理
- **当前**：部分接口缺少错误处理
- **建议**：统一错误处理机制，添加日志记录

### 4. API文档
- **当前**：无自动生成API文档
- **建议**：集成Swagger/OpenAPI，自动生成文档

### 5. 测试
- **当前**：无自动化测试
- **建议**：添加单元测试、集成测试 (Jest + Supertest)

### 6. CI/CD
- **当前**：无持续集成/部署
- **建议**：配置GitHub Actions或类似工具

---

## 联系方式与贡献

**项目负责人**：[待填写]  
**开发团队**：[待填写]  
**项目仓库**：[待填写]

**贡献指南**：
1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 许可证

[待指定许可证类型]

---

**文档版本**：v1.0  
**最后更新**：2026-06-07  
**文档作者**：WorkBuddy AI Assistant
