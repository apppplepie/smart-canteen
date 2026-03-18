# 三前端 + Nginx；后端地址在「运行容器时」用环境变量 BACKEND_UPSTREAM（见服务器 .env）
# 打包（仓库根目录，一条就够）：
#   docker compose -f docker-compose.frontend.yml build && docker push ${DOCKERHUB_USER}/scs-frontends:latest

FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY . .

ENV VITE_API_SAME_ORIGIN=true \
    VITE_BASE_URL=/api/v1 \
    VITE_APP_TITLE=SCS \
    VITE_ROUTER_HISTORY=hash
ENV VITE_API_BASE_URL=
ENV VITE_CHAT_API_BASE_URL=

WORKDIR /app/admin
RUN pnpm install --frozen-lockfile
ENV VITE_PUBLIC_PATH=/admin/
RUN pnpm run build

WORKDIR /app/mobile
ENV VITE_PUBLIC_PATH=/mobile/
RUN npm ci
RUN npm run build

WORKDIR /app/screen
ENV VITE_PUBLIC_PATH=/
RUN npm ci
RUN npm run build

FROM nginx:alpine

COPY frontends/nginx.conf /etc/nginx/templates/default.conf.tpl
COPY frontends/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

COPY --from=builder /app/screen/dist /usr/share/nginx/html
COPY --from=builder /app/admin/dist /usr/share/nginx/html/admin
COPY --from=builder /app/mobile/dist /usr/share/nginx/html/mobile

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
