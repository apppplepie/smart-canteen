#!/bin/sh
set -e
# 去掉 .env 里常见的引号、首尾空格，避免写错成 "http://ip:8081" 导致 Nginx 配置非法 → 502
_raw="${BACKEND_UPSTREAM:-http://172.17.0.1:8081}"
UP=$(printf '%s' "$_raw" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//;s/^"//;s/"$//;s/^'"'"'//;s/'"'"'$//')
echo "[scs-frontends] BACKEND_UPSTREAM=$UP" >&2
sed "s#__BACKEND_UPSTREAM__#${UP}#g" /etc/nginx/templates/default.conf.tpl > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
