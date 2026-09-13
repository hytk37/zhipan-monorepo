# 项目记忆 (zhipan-monorepo)

## 项目概述
高校智慧食堂营养分析与AI推荐系统，包含3个子系统：
- backend: Node.js + Express 后端 API
- admin: 单页管理后台
- miniapp: 微信小程序

## 开发分工
- 本电脑：backend + admin + miniapp（全部整合到 monorepo 内）
- v2 版本已合并，monorepo 是唯一代码源

## 技术要点

### 后端架构 (2026-06-07 重构为分层架构)
- 入口 `api-server.js` 只负责启动 + 挂载路由
- 路由分 5 个模块: `routes/overview.js`、`routes/kitchen.js`、`routes/student.js`、`routes/auth.js`、`routes/admin.js`
- 中间件在 `middleware/auth.js`（requireAdmin）
- 所有 Mock 数据在 `models/data.js`
- 端口 3000，监听 0.0.0.0
- 下一阶段计划: SQLite 持久化、JWT 认证、安全加固

### admin 后台
- 单文件 `admin/index.html`，暗色主题
- Chart.js 4.4.0 (CDN)
- 侧边栏导航切换 `.page` div
- CSS: `.page{display:none}` / `.page.active{display:block}`
- `const C` 定义图表颜色常量（含 text2, text3）
- 页面切换有 `pageFadeIn` 淡入动画（300ms）
- 颜色系统：深色暗调统一风格

### 图表系统
- **charts**: 原始管理后台图表（数据概览、售卖分析等）
- **dashCharts**: 大屏仪表板图表（学生端营养、后厨管理）
- `initDashCharts()`: 每个图表独立判断 canvas 是否存在且未创建
- 两个独立的 nav item 点击处理器：一个处理页面切换，一个处理仪表板图表

### 后端
- 端口 3000
- Token: 固定值 `ADMIN_SECRET_TOKEN`（持久化，重启后不失效）
- `requireAdmin` 中间件验证 Bearer token
- 401 时客户端清除 token 并弹出登录页

## 已删除模块
- **系统总览（page-dash-overview）** — 因 offsetHeight=0 的未知渲染问题，已彻底删除

## 常见问题
- **页面白屏**: 检查 JS 控制台是否有 `C is not defined` 等错误，检查 `const C` 声明
- **学生列表为空**: 检查 token 是否过期（401），重新登录
- **HTML 结构**: 删除模块时注意清理多余的 `</div>` 标签
- **访问方式**: 必须通过 `http://localhost:3000/admin` 访问（直接打开 HTML 文件会导致 API 跨域问题）
- 登录: admin / admin123（管理后台）
- 学生登录: stu2023010042 / 123456（小程序）

## 3 周企业级升级计划（已设计，待执行）
### 第 1 周：地基加固
- 代码库统一 + 后端分层拆分 (已完成 2026-06-07)
- SQLite 持久化（better-sqlite3）
- JWT + bcrypt 认证升级

### 第 2 周：功能增强
- 营养计算引擎（规则推荐）
- Admin 图表数据全部来自 API
- 小程序去除本地 Mock 依赖

### 第 3 周：生产级就绪
- 错误处理 + 日志系统
- 安全加固（输入校验、CORS 白名单、限流）
- Docker 化 + 部署脚本
- 全屏大屏模式 + API 文档
