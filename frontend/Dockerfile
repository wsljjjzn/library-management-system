# 构建阶段：在服务器容器内执行编译
FROM node:20-alpine AS build-stage

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com && npm install

COPY . .

# 增加 Node 内存上限，优化低配服务器编译稳定性
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN npm run build

# 生产运行阶段
FROM nginx:alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
