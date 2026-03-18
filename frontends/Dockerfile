# 一个镜像打包三个前端：admin（Vue）、mobile（React）、screen（React）
# 构建：在仓库根目录执行 docker build -f frontends/Dockerfile .
# 运行：docker run -p 80:80 <镜像名>

# ---------- 阶段 1：构建 ----------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY . .

# 构建 admin（Vue + pnpm，部署在 /admin/）
WORKDIR /app/admin
RUN pnpm install --frozen-lockfile
ENV VITE_PUBLIC_PATH=/admin/
RUN pnpm run build

# 构建 mobile（React + npm）
WORKDIR /app/mobile
ENV VITE_PUBLIC_PATH=/mobile/
RUN npm ci
RUN npm run build

# 构建 screen（React + npm，根路径入口）
WORKDIR /app/screen
ENV VITE_PUBLIC_PATH=/
RUN npm ci
RUN npm run build

# ---------- 阶段 2：运行（nginx 托管静态资源）----------
FROM nginx:alpine

COPY --from=builder /app/screen/dist /usr/share/nginx/html
COPY --from=builder /app/admin/dist /usr/share/nginx/html/admin
COPY --from=builder /app/mobile/dist /usr/share/nginx/html/mobile
COPY frontends/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
