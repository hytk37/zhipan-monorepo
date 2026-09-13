# HX系统 (智盘) 小程序 — 项目说明

## 项目结构
```
zhipan-miniapp/
├── app.js / app.json / app.wxss       ← 全局入口、配置、样式
├── project.config.json                 ← 微信开发者工具项目配置
├── sitemap.json
├── custom-tab-bar/                     ← 自定义底部导航 (4tab)
│   ├── index.js / index.wxml / index.wxss
├── pages/
│   ├── index/        ← 首页 (营养环形图+推荐+打卡+快捷功能)
│   ├── meals/        ← 记录 (用餐历史搜索+日视图+月统计)
│   ├── recommend/    ← 推荐 (7分类+AI方案+食堂精选+文化标签)
│   ├── profile/      ← 我的 (头像+等级+成就+6项设置入口)
│   ├── game/         ← 冒险 (游戏化闯关, navigateTo子页面)
│   ├── login/        ← 登录 (账号密码+token管理)
│   ├── settings/     ← 设置 (5类表单:资料/目标/过敏/身体/提醒)
│   ├── nutrition-detail/  ← 营养详情 (各营养素进度+AI建议)
│   └── food-detail/  ← 菜品详情 (营养成分+加入餐单)
└── utils/
    ├── api.js        ← API 请求封装 (Bearer token + 401重试)
    └── game-theme.js ← 冒险页9套主题 (5深色+4浅色)
```

## 架构关键约定

### 导航系统
- **TabBar**: 自定义组件 `custom-tab-bar/`，4项 (首页/记录/推荐/我的)
- **冒险页**: 非 tab 页，通过 custom-tab-bar 的 navigateTo 打开，自带 `‹` 返回按钮
- **冒险页标记**: custom-tab-bar list 中 `isGame: true` → navigateTo 而非 switchTab
- **TabBar selected 索引**: 0=首页 1=记录 2=推荐 3=我的

### 页面底部 padding
所有 tab 页: `padding-bottom: calc(100rpx + env(safe-area-inset-bottom, 0))`

### WXML 限制
不支持 `.toFixed()`, `.indexOf()`, `.filter()` 等 JS 方法 → 全部在 JS 中预计算为 data 字段

### 数据流
本地 Storage (快速显示) → 异步服务器同步 (静默失败)

## 使用方式
1. 微信开发者工具打开 `zhipan-miniapp/` 目录
2. AppID 选择"测试号"即可调试
3. API 地址在 `app.js` → `globalData.apiBase` (默认 `http://192.168.25.67:3000`)

## 协同开发
详见 `COLLAB_GUIDE.md`，推荐 Git + GitHub/Gitee 方案。

## 功能清单
- **首页**: 营养环形评分、5项进度条、今日推荐、打卡 (+5分)、本周趋势图
- **记录**: 搜索菜品、5日用餐记录、月度统计 (打卡天数/均热/均分)
- **推荐**: 7分类筛选、AI双方案、食堂精选(13款多文化菜品)、饮食偏好标签
- **我的**: BMI+等级(5档)、4项成就、6项设置入口 (资料/目标/过敏/身体/提醒)
- **冒险**: 4tab SPA (地图+状态+补给+档案)、Canvas粒子、9套主题、RPG属性面板
- **营养详情**: 5营养素进度条、5日历史评分、3条建议
- **菜品详情**: 营养表格、加入餐单
- **设置**: 6肤色头像选择器、7饮食偏好(清真/蛋奶素/无麸质/低敏)、BMI实时计算
