# Backend — API 服务 + 数据大屏

## 文件

| 文件 | 说明 |
|------|------|
| `api-server.js` | Express API 服务，端口 3000 |
| `index.html` | 数据可视化大屏 (学生端/后厨管理/数据总览) |
| `ARCHITECTURE.md` | 系统架构与数据流设计 |

## 启动

```bash
cd backend
npm install
node api-server.js
# 或 Windows 双击 start-server.bat
```

访问:
- 大屏: 浏览器打开 `index.html` 或 `http://localhost:3000`
- API: `http://localhost:3000/api/...`

## API 端点

| 分组 | 路由 | 说明 |
|------|------|------|
| 学生 | GET/PUT `/api/students/:id` | 学生信息 |
| 营养 | GET `/api/students/:id/nutrition` | 今日营养数据 |
| 历史 | GET `/api/students/:id/history` | 营养历史 |
| 菜品 | GET `/api/foods` | 菜品列表 |
| 提醒 | PUT `/api/students/:id/remind` | 提醒设置 |

## 大屏功能

- **学生端视图**: 6名学生营养数据对比
- **后厨管理端**: 采购预测、销量排行、营养预警
- **数据总览**: 4,000名学生、日均4,278人次
