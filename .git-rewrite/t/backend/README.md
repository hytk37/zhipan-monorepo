# Backend — API 服务 + 数据大屏

## 文件

| 路径 | 说明 |
|------|------|
| `api-server.js` | Express API 服务入口，端口 3000 |
| `routes/` | 5 个业务路由：auth / overview / kitchen / student / admin |
| `middleware/auth.js` | 认证中间件（当前为固定 token，待迁 JWT） |
| `models/data.js` | 内存 Mock 数据（**待迁移至 MySQL**） |
| `sql/schema.sql` | MySQL 8 建表脚本：20 张表 + 4 个视图 |
| `sql/seed-demo.sql` | 6 名演示学生的种子数据示例（生成产物，便于直接查看） |
| `config/db.js` | MySQL 连接池 + query / transaction 封装 |
| `config/env.js` | 极简 .env 加载器（零依赖） |
| `utils/password.js` | scrypt 密码哈希与校验（替代明文密码） |
| `repositories/` | 数据仓储层：student / nutrition（打样） |
| `scripts/seed.js` | 种子数据生成：4000 名学生 / 30 天汇总 / 7 天明细 |
| `scripts/check-sql.js` | SQL 结构自检（不需要 MySQL） |
| `scripts/db-smoke-test.js` | 数据库层自检（连不上库时自动跳过） |
| `scripts/smoke-test.js` | 接口冒烟测试（50 项断言，走 Mock） |
| `ARCHITECTURE.md` | 系统架构与数据流设计 |

## 启动（沿用内存 Mock）

```bash
cd backend
npm install
node api-server.js
# 或 Windows 双击 start-server.bat
```

访问：大屏 `http://localhost:3000/admin` ｜ API `http://localhost:3000/api/...`

登录：管理后台 `admin / admin123`，小程序学生 `stu2023010042 / 123456`

## 数据库（MySQL 8）

### 三步跑起来

```bash
# ① 建库建表（会创建 zhipan_canteen）
mysql -u root -p < sql/schema.sql

# ② 配置凭据
cp .env.example .env      # 然后修改 DB_USER / DB_PASSWORD

# ③ 灌入种子数据（4000 名学生 / 30 天汇总 / 7 天用餐明细）
npm run db:seed
```

不需要数据库也能做的检查：

```bash
npm run db:check       # SQL 结构 + 语法自检
npm run db:seed:dry    # 只算不入库，打印规模与分布自检
npm run db:seed:file   # 导出 6 名演示学生的 SQL 样本
npm run db:test        # 数据库层自检（无库时自动跳过）
npm test               # 接口冒烟测试（50 项，走 Mock）
```

### 核心表

| 域 | 表 |
|----|----|
| 身份 | `student` `student_goal` `student_allergen` `college` `allergen` `admin_user` |
| 菜品 | `dish` `tag` `dish_tag` `dish_allergen` `canteen` |
| 用餐事实 | `meal_record` `meal_record_item` `nutrition_daily` `checkin_record` `dish_sales_daily` |
| 互动 | `remind_setting` `student_game_profile` `game_chest_log` `recommendation_log` |

### 视图（把写死的统计口径变成可复算的查询）

| 视图 | 对应接口 |
|------|----------|
| `v_student_today_nutrition` | 今日营养实时聚合 |
| `v_fiber_distribution` | `GET /api/overview/fiber-dist` |
| `v_group_nutrition_ratio` | `GET /api/group-radar` |
| `v_student_health_level` | 大屏「健康 / 亚健康 / 高风险」分层 |

### 数据量与归档

按 4,000 名学生估算：`meal_record` 约 4.3 千行/天（日均 4,278 人次），
`meal_record_item` 约 8 千行/天，`nutrition_daily` 4 千行/天。
明细表建议保留 12 个月后归档；`nutrition_daily` 永久保留，作为所有统计的唯一入口。

### 设计原则

1. **只存事实**——达标率、徽章（`badge-over`）、颜色（`calClass`）等派生值由查询或服务层算
2. **接口契约不变**——repository 返回值形状与原 Mock 一致，路由只需改 `require` 来源
3. **汇总永不漂移**——任何写路径结束后调用 `nutrition.recomputeDaily()`，以明细为准重算

## 待办（从 Mock 到生产）

- [ ] 路由层切换到 repositories（先切读接口，再切写接口）
- [ ] 认证升级：scrypt 校验 + JWT（`utils/password.js` 已就绪）
- [ ] 全部查询参数化（repositories 已用占位符）
- [ ] `admin/index.html` 的 3 处真实请求扩展为全量 API 驱动

## 大屏功能

- **学生端视图**: 6名学生营养数据对比
- **后厨管理端**: 采购预测、销量排行、营养预警
- **数据总览**: 4,000名学生、日均4,278人次
