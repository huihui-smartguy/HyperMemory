# ================================================================
# NovaMem Dashboard · 多阶段 Docker 构建
# ================================================================
# 阶段说明：
#   deps    — 仅安装生产依赖（npm ci --omit=dev），利用层缓存加速重建
#   builder — 复制源码并执行 next build，输出 .next/standalone
#   runner  — 最小运行时镜像，非 root 用户，仅包含必要产物
#
# 构建命令：
#   docker build -t novamem-ui .
#   docker build -t novamem-ui --build-arg NEXT_PUBLIC_DATA_MODE=bff .
#
# 运行命令：
#   docker run -p 3000:3000 \
#     -e BFF_USE_MOCK_BACKEND=1 \
#     novamem-ui
# ================================================================

# ------ Stage 1: 依赖安装 ------
FROM node:20-alpine AS deps
WORKDIR /app

# 优先复制锁文件，最大化层缓存命中率
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts


# ------ Stage 2: 构建 ------
FROM node:20-alpine AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
# 复制全部源码
COPY . .

# NEXT_PUBLIC_* 必须在构建期注入（会被打入 JS bundle）
# 运行时环境变量（NOVAMEM_BASE_URL 等）在 runner 阶段通过 -e 传入即可
ARG NEXT_PUBLIC_DATA_MODE=bff
ARG NEXT_PUBLIC_TENANT=理财部 · Wealth-01
ARG NEXT_PUBLIC_SSE_LIVE=true
ARG NEXT_PUBLIC_MOCK_LATENCY_MS=0
ARG NEXT_PUBLIC_API_BASE_URL=

ENV NEXT_PUBLIC_DATA_MODE=$NEXT_PUBLIC_DATA_MODE
ENV NEXT_PUBLIC_TENANT=$NEXT_PUBLIC_TENANT
ENV NEXT_PUBLIC_SSE_LIVE=$NEXT_PUBLIC_SSE_LIVE
ENV NEXT_PUBLIC_MOCK_LATENCY_MS=$NEXT_PUBLIC_MOCK_LATENCY_MS
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# 关闭遥测
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ------ Stage 3: 运行时（最小镜像）------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 非 root 用户，提升安全性
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone 产物：仅包含运行 next start 所需的最小文件集
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

USER nextjs

EXPOSE 3000

# 运行时可通过 -e 覆盖以下变量（不进入 bundle，无需重新构建）：
#   NOVAMEM_BASE_URL      — NovaMem 后端地址，默认 http://localhost:8001
#   BFF_USE_MOCK_BACKEND  — 1=内置 mock，0=接真实后端
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
