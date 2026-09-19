# Koyeb / Heroku 类平台的启动声明（buildpack 构建方式使用）
#
# 说明：本项目是 monorepo，服务入口在 backend/ 下，但后端要读取同级的
# admin/（管理大屏）与 demo/（扫码体验页），因此启动命令必须从仓库根执行。
#
# 用 Dockerfile 构建时会忽略本文件；只有选择 Buildpack 构建时才生效。
web: node backend/api-server.js
