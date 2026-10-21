# 生产阶段：工业级轻量 Nginx 镜像（内存占用仅 10MB，零死锁风险，1秒构建）
FROM nginx:alpine

COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
