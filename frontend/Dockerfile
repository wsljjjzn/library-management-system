# 构建阶段：采用标准 Debian glibc 运行环境 (node:20-slim)，彻底杜绝 Alpine 线程死锁挂起
FROM node:20-slim AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com && npm install --no-audit --no-fund

COPY . .

# 专为 1G 内存服务器优化 Node 内存分配
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN npm run build

# 生产运行阶段：轻量 Nginx 服务
FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
