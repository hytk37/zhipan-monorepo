# ============================================
# 智慧膳系统 · 生产镜像（Koyeb / 任意容器平台）
# ============================================
# 构建要点：
#   1. 镜像内使用仓库根目录结构 —— 后端要读取同级的 admin/（管理大屏）与 demo/（扫码体验页）
#   2. 端口不写死：应用读取平台注入的 PORT（Koyeb 会自动设为「暴露端口」）
#   3. 不打包任何密钥：backend/.env 由 .dockerignore 排除，
#      AI Key 通过平台的 Secret / 环境变量注入

FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

# 先装依赖，单独一层以利用构建缓存
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install --omit=dev --no-audit --no-fund

# 再复制运行所需代码：后端 + 管理大屏 + 手机体验页
# （三者缺一不可：/admin、/demo、/api/demo/qr.png 都依赖这几个目录）
COPY backend/ ./backend/
COPY admin/ ./admin/
COPY demo/ ./demo/

# 暴露端口只作声明；实际监听端口由平台注入的 PORT 决定（Koyeb 默认为暴露端口）
EXPOSE 8000

# 容器自检：健康检查打保活接口（alpine 无 curl，用 node 内置 fetch）
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8000)+'/api/demo/ping').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/api-server.js"]
