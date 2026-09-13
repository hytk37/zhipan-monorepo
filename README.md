# 智盘 (HX系统) — 全栈工程

高校智慧食堂营养分析与AI推荐系统，包含：
- 学生端微信小程序
- 管理后台 (暗色大屏)
- Node.js API 服务

## 目录结构

```
zhipan-monorepo/
├── README.md                     ← 本文件
├── .gitignore
│
├── backend/                      ← Node.js + Express API
│   ├── api-server.js             ← 入口 (仅启动 + 路由挂载)
│   ├── routes/
│   │   ├── overview.js           ← 数据概览 (7 接口)
│   │   ├── kitchen.js            ← 后厨管理 (10 接口)
│   │   ├── student.js            ← 学生业务 (12 接口)
│   │   ├── auth.js               ← 登录认证 (3 接口)
│   │   └── admin.js              ← 管理员 (2 接口, 需认证)
│   ├── middleware/
│   │   └── auth.js               ← requireAdmin 中间件
│   ├── models/
│   │   └── data.js               ← Mock 数据模型
│   ├── package.json
│   └── start-server.bat
│
├── admin/                        ← 管理后台 (单文件)
│   └── index.html                ← Chart.js + 暗色主题
│
└── miniapp/                      ← 微信小程序 (50 文件)
    ├── app.js / app.json / app.wxss
    ├── custom-tab-bar/
    ├── pages/                    ← 9 个页面
    │   ├── index/                ← 首页 (营养 + 打卡 + 推荐)
    │   ├── meals/                ← 记录
    │   ├── recommend/            ← 推荐
    │   ├── profile/              ← 我的
    │   ├── game/                 ← 冒险 (游戏化闯关)
    │   ├── login/                ← 登录
    │   ├── settings/             ← 设置
    │   ├── nutrition-detail/     ← 营养详情
    │   └── food-detail/          ← 菜品详情
    └── utils/
        ├── api.js                ← API 请求封装
        └── game-theme.js         ← 冒险9套主题
```

## 快速开始

### 1. 启动后端

```bash
cd backend
npm install          # 首次需要安装依赖
node api-server.js   # 启动 API → http://localhost:3000
# 或双击 start-server.bat
```

### 2. 打开管理后台

浏览器访问 **http://localhost:3000/admin**（通过后端静态托管）
- 登录: admin / admin123

### 3. 启动小程序

微信开发者工具 → 导入项目 → 选择 `miniapp/` 目录
- 学生登录: stu2023010042 / 123456

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 API | Node.js + Express (分层架构) |
| 管理后台 | HTML + Chart.js 4.4 + CSS Variables 暗色主题 |
| 小程序 | 微信原生框架 + Canvas 2D API |
| 数据 | 内存 Mock (规划中: SQLite) |
| 认证 | Bearer Token (规划中: JWT + bcrypt) |
