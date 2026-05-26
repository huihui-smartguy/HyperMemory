# NovaMem Dashboard · 容器化部署指南

本文档说明如何通过 Docker / docker-compose 将 NovaMem 前端控制台部署到容器环境。

---

## 目录

1. [快速上手（演示环境）](#1-快速上手演示环境)
2. [生产部署](#2-生产部署)
3. [仅构建镜像](#3-仅构建镜像)
4. [环境变量说明](#4-环境变量说明)
5. [构建时 ARG vs 运行时 ENV](#5-构建时-arg-vs-运行时-env)
6. [健康检查](#6-健康检查)
6.5. [按模块裁剪（生产精简模式）](#65-按模块裁剪生产精简模式)
7. [本地非容器部署](#7-本地非容器部署)
8. [常见问题](#8-常见问题)

---

## 1. 快速上手（演示环境）

**零外部依赖**：前端内置 mock 后端（`BFF_USE_MOCK_BACKEND=1`），无需启动真实 NovaMem 服务。

```bash
# 克隆仓库
git clone <repo-url>
cd novamem-dashboard   # 或仓库克隆后的目录名

# 一键启动
docker compose up

# 访问控制台
open http://localhost:3000
```

首次构建约需 3–5 分钟（Node.js 依赖 + Next.js 编译）。后续重启（无代码变更）约 10 秒。

---

## 2. 生产部署

生产部署需要真实的 NovaMem 后端服务（由后端团队提供镜像）。

### 2.1 构建前端镜像

```bash
# 构建生产镜像（指定数据模式为 bff）
docker build \
  --build-arg NEXT_PUBLIC_DATA_MODE=bff \
  --build-arg NEXT_PUBLIC_SSE_LIVE=true \
  -t novamem-ui:latest .

# （可选）推送到私有镜像仓库
docker tag novamem-ui:latest registry.example.com/novamem-ui:latest
docker push registry.example.com/novamem-ui:latest
```

### 2.2 启动生产环境

```bash
docker compose -f docker-compose.prod.yml up -d

# 查看日志
docker compose -f docker-compose.prod.yml logs -f novamem-ui

# 停止
docker compose -f docker-compose.prod.yml down
```

### 2.3 反向代理（推荐）

生产环境建议在前端加 Nginx 或 Traefik 做 TLS 终止，不直接暴露 3000 端口。

Nginx 示例：

```nginx
server {
    listen 443 ssl;
    server_name novamem.example.com;

    ssl_certificate /etc/ssl/certs/novamem.crt;
    ssl_certificate_key /etc/ssl/private/novamem.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # SSE 支持（Schema 进化车间流式输出）
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

---

## 3. 仅构建镜像

```bash
# 默认构建（bff 模式）
docker build -t novamem-ui .

# 指定数据模式
docker build --build-arg NEXT_PUBLIC_DATA_MODE=mock -t novamem-ui:mock .

# 运行（覆盖运行时环境变量）
docker run -p 3000:3000 \
  -e BFF_USE_MOCK_BACKEND=0 \
  -e NOVAMEM_BASE_URL=http://your-backend:8001 \
  novamem-ui
```

---

## 4. 环境变量说明

### 构建时变量（`ARG` / `--build-arg`）

这些变量会被打入 JavaScript bundle，**修改后需重新构建镜像**。

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NEXT_PUBLIC_DATA_MODE` | `bff` | 数据模式：`mock` \| `bff` \| `live` |
| `NEXT_PUBLIC_TENANT` | `理财部 · Wealth-01` | 默认租户显示名 |
| `NEXT_PUBLIC_SSE_LIVE` | `true` | SSE 真实模式（false 用 setTimeout 模拟） |
| `NEXT_PUBLIC_MOCK_LATENCY_MS` | `0` | mock 模式人工延迟（毫秒） |
| `NEXT_PUBLIC_API_BASE_URL` | *(空)* | live 模式直连远端网关地址 |
| `NEXT_PUBLIC_ENABLED_MODULES` | `vault,dev`（生产）<br>`vault,analytics,evolution,cognitive-graph,retrieval-xray,dev`（开发） | 启用的功能模块列表（逗号分隔） |

### 运行时变量（`-e` / `environment:`）

这些变量**不进入客户端 bundle**，修改后重启容器即生效，无需重建镜像。

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NOVAMEM_BASE_URL` | `http://localhost:8001` | NovaMem 后端地址（仅 BFF server 可见） |
| `BFF_USE_MOCK_BACKEND` | `0` | `1` = BFF 内部短路 mock，`0` = 接真实后端 |
| `PORT` | `3000` | 容器内监听端口 |
| `HOSTNAME` | `0.0.0.0` | 容器内监听地址 |

> **安全提示**：`NOVAMEM_BASE_URL` 没有 `NEXT_PUBLIC_` 前缀，**不会**出现在浏览器可见的 JavaScript bundle 中，可安全填写内网地址。

---

## 5. 构建时 ARG vs 运行时 ENV

Next.js 的一个关键约束：**`NEXT_PUBLIC_*` 前缀的变量在 `next build` 时静态替换**，运行时修改这些变量无效。

```
构建时注入（需 --build-arg）:
  NEXT_PUBLIC_DATA_MODE=bff → bundle 中硬编码为 "bff"

运行时可覆盖（-e 或 environment:）:
  NOVAMEM_BASE_URL=http://backend:8001  → 服务器端 Node.js process.env 实时读取
  BFF_USE_MOCK_BACKEND=0               → 同上
```

**实践建议**：
- 统一为同一数据模式（通常 `bff`）构建一个镜像
- 通过运行时 `-e NOVAMEM_BASE_URL` 切换连接不同后端实例（开发/测试/生产）
- 每次修改 `NEXT_PUBLIC_*` 都需要 `docker build` 重新构建

---

## 6. 健康检查

容器内置健康检查，每 30 秒探测一次：

```bash
# 手动检查
curl http://localhost:3000/api/v1/health

# 期望响应（BFF_USE_MOCK_BACKEND=1 时）
{
  "status": "ok",
  "version": "mock-novamem-0.1",
  "milvus_lite_ok": true,
  "sqlite_ok": true,
  "uptime_s": 42,
  "memory_count": 3,
  "cpu_pct": 28,
  "mem_pct": 52
}

# 查看 Docker 健康状态
docker inspect --format='{{.State.Health.Status}}' novamem-ui
```

---

## 6.5 按模块裁剪（生产精简模式）

考虑到后端目前只具备「存记忆/查记忆」能力，生产部署应该只暴露**记忆金库**与**开发者中心**这两个功能模块；运行大盘、Schema 进化车间、认知拓扑引擎、召回 X 光机等高级模块在后端补齐之前，应该在前端屏蔽。

### 实现机制

构建期变量 `NEXT_PUBLIC_ENABLED_MODULES`（逗号分隔的模块列表）控制三件事：

| 位置 | 行为 |
|------|------|
| 顶部导航 `MegaMenu` | 过滤 NAV 数组，空 group 自动隐藏 |
| 主页模块网格 `app/page.tsx` | 过滤 MODULES 数组 |
| `middleware.ts` 路由拦截 | 禁用模块的 URL 308 重定向到 `/basic/vault` |

可选 key：`vault` · `analytics` · `evolution` · `cognitive-graph` · `retrieval-xray` · `dev`

**注意**：`vault` 永远启用（系统核心）。

### 三种典型配置

```bash
# A) 完整演示（开发/演示）
NEXT_PUBLIC_ENABLED_MODULES=vault,analytics,evolution,cognitive-graph,retrieval-xray,dev

# B) 生产精简（推荐 - docker-compose.prod.yml 默认）
NEXT_PUBLIC_ENABLED_MODULES=vault,dev

# C) 纯运营（只看记忆，连 dev 也屏蔽）
NEXT_PUBLIC_ENABLED_MODULES=vault
```

### 在 Docker 中切换

```bash
# 生产精简（默认）
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 临时调整（保留 analytics）
docker build \
  --build-arg NEXT_PUBLIC_ENABLED_MODULES=vault,analytics,dev \
  -t novamem-ui:custom .
```

### 在本机切换

```bash
# 生产精简（仅 vault + dev）
npm run start:prod         # cross-env 已设置 ENABLED_MODULES=vault,dev
# 或直接：
NEXT_PUBLIC_ENABLED_MODULES=vault,dev npm run build && npm start
```

**重要**：`NEXT_PUBLIC_ENABLED_MODULES` 是构建期变量，**修改后必须 `npm run build` / `docker build` 重新构建镜像**。运行时通过 `docker run -e` 设置无效。

---

## 7. 本地非容器部署

适合裸机 / VM / 自管 PM2 等不使用 Docker 的场景。生产模式（模块开关）在本地完全可用。

### 7.1 三档启动场景

| 场景 | 适用 | 命令链 |
|------|------|--------|
| **A · 开发预览（生产配置）** | 临时验证生产模式 UI 但保留热重载 | `npm run dev:prod` |
| **B · 本地生产部署（推荐）** | 单机长期跑（非容器） | `npm run build:prod && npm run start:prod` |
| **C · 自定义配置部署** | 需特殊 ENABLED_MODULES 组合 | 见 7.4 |

### 7.2 场景 B · 本地生产部署完整流程

```bash
# 1) 安装依赖（首次或 lock 文件变更后）
npm ci

# 2) 配置后端地址（可选）
cp .env.example .env.local
# 编辑 .env.local：
#   NOVAMEM_BASE_URL=http://your-backend-host:8001   # 真实后端
#   BFF_USE_MOCK_BACKEND=0                            # 0=接真实后端，1=内置 mock
# 注：NEXT_PUBLIC_ENABLED_MODULES 由 npm run build:prod 注入，无需在 .env.local 设置

# 3) 构建（注入 ENABLED_MODULES=vault,dev 到 client bundle）
npm run build:prod
# 产物：.next/   （生产服务器只需要这个目录 + node_modules + package.json + public）

# 4) 启动
npm run start:prod
# 默认 :3000；自定义端口：PORT=4000 npm run start:prod
```

启动后顶部导航只剩「记忆金库」+「开发者中心」；其它路由会 308 重定向到 vault。

### 7.3 后台进程托管（PM2 示例）

```bash
npm i -g pm2

# 第一次启动
pm2 start npm --name novamem-ui -- run start:prod
pm2 save
pm2 startup     # 让 PM2 开机自启

# 查看 / 重启 / 停止
pm2 status
pm2 logs novamem-ui
pm2 restart novamem-ui
pm2 stop novamem-ui
```

### 7.4 自定义 ENABLED_MODULES 部署

如果需要的模块组合既不是 `vault,dev`（生产默认）也不是全部，直接传环境变量到 build/start：

```bash
# 比如运营场景：仅 vault + analytics
NEXT_PUBLIC_DATA_MODE=bff \
NEXT_PUBLIC_ENABLED_MODULES=vault,analytics \
npm run build

NEXT_PUBLIC_DATA_MODE=bff \
NEXT_PUBLIC_ENABLED_MODULES=vault,analytics \
npm start
```

**关键点**：`NEXT_PUBLIC_ENABLED_MODULES` 在 `next build` 时被静态写入 JS bundle，`next start` 时也需要传一致的值给 `middleware.ts`。同一对值必须出现在 build 和 start 两步，否则前端导航和路由中间件行为会不一致。

### 7.5 反向代理（Nginx 示例）

```nginx
server {
    listen 80;
    server_name novamem.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # SSE 支持（Schema 进化车间等流式接口）
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```

### 7.6 验证

```bash
# 健康检查
curl http://localhost:3000/api/v1/health

# 模块开关验证（生产模式下分析模块应 308）
curl -sI http://localhost:3000/basic/analytics | head -2
# 期望：HTTP/1.1 308 Permanent Redirect
#       location: /basic/vault

# 主页应只显示启用的模块
curl -s http://localhost:3000 | grep -c "进入 →"
# 期望：与启用模块数一致（vault,dev → 2）
```

---

## 8. 常见问题

### Q: 端口 3000 被占用

```bash
# 查找占用进程
lsof -i :3000
# 或修改 docker-compose.yml 中的端口映射
ports:
  - "3001:3000"   # 改为 3001 对外暴露
```

### Q: `.env.local` 与 Docker ENV 优先级

Docker 容器内**不会**加载本地 `.env.local` 文件（该文件被 `.dockerignore` 排除）。容器内环境变量通过 `docker-compose.yml` 的 `environment:` 字段或 `-e` 参数设置，优先级高于 `.env.example` 默认值。

### Q: 首次构建很慢

这是正常的。Node.js 依赖安装（`npm ci`）和 Next.js 编译需要时间。Docker 层缓存会加速后续构建：
- 仅修改源码（不修改 `package.json`）：跳过 deps stage，约 1–2 分钟
- 修改依赖：完整重建，约 3–5 分钟

### Q: 如何查看 BFF 是否成功连接后端

```bash
# 检查 vault 接口（需要搜索关键词）
curl "http://localhost:3000/api/v1/memory/vault?q=避险"
# 响应头 x-data-source: real 表示连接到真实后端
# 响应头 x-data-source: mock 表示使用内置 mock 数据
```

### Q: Schema 进化车间的 SSE 流在 Nginx 后不工作

确保 Nginx 配置了 `proxy_buffering off` 和 `proxy_cache off`，并将 `proxy_read_timeout` 设置为足够大的值（如 `300s`）。见 [2.3 反向代理](#23-反向代理推荐)。

---

## 相关文档

- [INTEGRATION.md](./INTEGRATION.md) — BFF 模式架构、端点映射矩阵、租户机制
- [.env.example](../.env.example) — 所有环境变量及默认值说明
- [scripts/mock-novamem.mjs](../scripts/mock-novamem.mjs) — 本地开发用 mock 后端
