# 构建阶段：针对 1G 内存小规格服务器深度轻量化
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com && npm install --no-audit --no-fund

COPY . .

# 专为 1G 内存环境限制 Node 进程上限为 512M，杜绝 OOM 卡死
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN npm run build

# 生产运行阶段：轻量 Nginx 服务
FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
