# 智慧膳系统（Smart Canteen）

高校食堂**营养分析与 AI 推荐**系统。以真实食堂周食谱为基础，把学生一周吃过的菜品换算成营养数据，用 DeepSeek 生成可读的健康分析与改进建议，并同步呈现在学生端、后厨端与管理大屏。

> 演示入口：`/demo`（手机体验版，免登录）· 投屏二维码：`/demo/qr.html` · 管理大屏：`/admin`

---

## 一、目录结构

```
zhipan-monorepo/
├── README.md
├── render.yaml                     ← Render 部署蓝图（云端演示用）
├── .gitattributes / .gitignore
│
├── backend/                        ← Node.js + Express 5 API
│   ├── api-server.js               ← 入口（中间件 + 路由挂载 + 静态托管）
│   ├── config/
│   │   ├── env.js                  ← 零依赖 .env 解析
│   │   ├── deepseek.js             ← AI 接入配置（模型/超时/并发/预算）
│   │   └── db.js                   ← MySQL 连接配置
│   ├── routes/                     ← overview / kitchen / student / ai / demo / auth / admin
│   ├── services/
│   │   ├── calendar.js             ← 日历工具（菜单日期锚定当前自然周）
│   │   ├── weekMeals.js            ← 周用餐记录 + 确定性营养统计与评分
│   │   ├── demoInfo.js             ← 演示地址探测（公网 > 局域网）
│   │   └── ai/                     ← client / prompts / weekHealth / coach / recognize
│   ├── models/
│   │   ├── data.js                 ← 内存数据源（含 222 张菜品营养卡、周菜单）
│   │   └── dishRules.js            ← 过敏原与饮食禁忌硬过滤
│   ├── sql/                        ← MySQL schema + 种子数据（20 表 / 68 索引 / 4 视图）
│   ├── repositories/               ← 数据库仓储打样（尚未接管运行时）
│   └── scripts/                    ← smoke-test / preflight / seed / check-sql
│
├── admin/index.html                ← 管理大屏（单文件，Chart.js + 暗色主题）
│
├── demo/                           ← 嘉宾扫码体验（手机网页版，零依赖免登录）
│   ├── index.html                  ← 体验页：本周分析 / 追问 AI / 本周菜单 / 拍照记餐
│   └── qr.html                     ← 投屏二维码页
│
└── miniapp/                        ← 微信小程序学生端（10 个页面）
    ├── app.js / app.json / app.wxss
    ├── custom-tab-bar/
    ├── pages/
    │   ├── index/                  ← 首页（营养 + 打卡 + 推荐 + AI 入口）
    │   ├── week-health/            ← 本周饮食健康分析（AI 交互）
    │   ├── meals/                  ← 用餐记录
    │   ├── recommend/              ← AI 推荐 / 食堂精选
    │   ├── nutrition-detail/       ← 营养报告
    │   ├── food-detail/ profile/ settings/ login/ game/
    └── utils/api.js                ← 请求封装（含 ai 接口组）
```

---

## 二、本地跑起来

```bash
cd backend
npm install
npm start
```

启动后控制台会打印全部入口：

```
地址:      http://localhost:3000
admin:     http://localhost:3000/admin          (admin / admin123)
📱 嘉宾扫码体验: http://192.168.x.x:3000/demo     [局域网]
🖥  投屏用二维码页: http://192.168.x.x:3000/demo/qr.html
AI: 未配置 Key（接口走规则模板降级，功能仍可用）
```

**小程序端**：微信开发者工具导入 `miniapp/` 目录，学生账号 `stu2023010042 / 123456`。

### 配置 AI（可选）

把 DeepSeek API Key 填到 `backend/.env` 的 `DEEPSEEK_API_KEY=`（文件可从 `.env.example` 复制）。
**不填也能完整演示** —— 所有 AI 能力自动降级为规则模板，页面不会报错。
详见 `产物/AI功能设计/AI配置说明.md`。

---

## 三、命令

| 命令 | 作用 |
|---|---|
| `npm start` | 启动服务 |
| `npm run preflight` | **部署前自检**（目录 / 依赖 / AI 配置 / 关键接口 / 演示地址）★ 上线前推荐跑 |
| `npm test` | 接口冒烟测试（73 项断言，含 AI 与演示模式） |
| `npm run db:check` | MySQL schema 语法自检（无需数据库） |
| `npm run db:seed:dry` | 种子数据 dry-run |

---

## 四、部署到云端（嘉宾任意网络扫码体验）

仓库根目录已有 `render.yaml`，用 Render 部署只需三步：

1. 把本仓库推到 GitHub
2. Render 控制台 → **New → Blueprint** → 选择本仓库（自动读取 `render.yaml`）
3. 在服务的 **Environment** 里填 `DEEPSEEK_API_KEY`（不填也能跑）

部署完成后：

- 体验页：`https://你的域名/demo`
- 投屏二维码：`https://你的域名/demo/qr.html`
- 地址优先级：`PUBLIC_BASE_URL` > `RENDER_EXTERNAL_URL`（平台自动注入）> 局域网 IP

> ⚠️ 免费实例 15 分钟无访问会休眠，冷启动 30–60 秒。
> 演示前先打开一次预热，或用监控每 10 分钟访问 `/api/demo/ping` 保活。
> 完整步骤、现场检查清单与风险预案见 `产物/AI功能设计/演示方案-嘉宾扫码体验.md`。

---

## 五、AI 能力设计原则（边界三原则）

| 原则 | 含义 |
|---|---|
| **数值不动手** | 热量、蛋白质、脂肪、纤维、评分全部由确定性代码从菜品库计算，模型只做解释与表达 |
| **安全不过模型** | 过敏原与饮食禁忌（清真 / 素食 / 蛋奶素 / 无麸质 / 低敏）是硬过滤，模型无权参与、无权绕过 |
| **输出必过 schema** | 模型输出必须通过 JSON 字段校验，失败即降级为规则模板，页面永远有内容 |

### 主要接口

| 接口 | 说明 |
|---|---|
| `GET /api/ai/health/week/:studentId` | 本周饮食健康分析（确定性评分 + AI 解读 + 逐餐点评 + 建议） |
| `POST /api/ai/chat` | 追问对话（固定前缀命中上下文缓存，输入成本约为未命中的 1/5） |
| `POST /api/ai/recognize-meal` | 拍照识别一餐（模型只认菜名与份量，营养由菜品库计算） |
| `GET /api/ai/week-meals/:studentId` | 本周逐餐菜品明细 |
| `POST /api/ai/meal-log` | 手动记一餐（同样过禁忌硬过滤） |
| `GET /api/ai/candidates/:studentId` | 该生可吃的菜品候选（已过滤禁忌） |
| `GET /api/ai/status` · `/api/ai/usage` | AI 配置状态与 token 用量 |
| `GET /api/demo/config` · `/api/demo/qr.png` · `/api/demo/ping` | 演示配置 / 二维码 / 健康检查 |
| `GET /api/menu/week` | 本周菜单（日期跟随当前自然周自动同步） |

---

## 六、技术栈

| 模块 | 技术 |
|---|---|
| 后端 API | Node.js 18+ / Express 5（分层：routes → services → models） |
| AI | DeepSeek（`deepseek-flash` 识图与文案 / `deepseek-v4-pro` 推理），内置 fetch 调用，无额外 SDK |
| 管理大屏 | 原生 HTML + CSS Variables 暗色主题 + Chart.js 4.4 |
| 小程序 | 微信原生框架 + Canvas 2D |
| 演示页 | 单文件 HTML（零依赖、免登录） |
| 数据 | 内存 Mock（MySQL 层已建好，尚未接管运行时） |
| 依赖 | express / cors / qrcode / mysql2（+ dev node-sql-parser） |

---

## 七、数据说明

- **菜品数据**：来自真实食堂周食谱（217 个菜单条目 → 222 张菜品营养卡）
- **营养数值**：按食物成分表口径估算的演示数据，非实验室检测值
- **时间**：菜单日期按当前自然周动态计算，不写死；跨天缓存自动失效重建
- **健康评分**：规则模型计算（脂肪 / 纤维 / 蛋白 / 热量达标情况 + 重油菜品道次 + 食物多样性），AI 不参与打分
- **演示身份**：6 位学生覆盖无限制 / 清真 / 蛋奶素 / 无麸质 / 低敏 / 增肌增重等场景
