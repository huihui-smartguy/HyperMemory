# NovaMem · 前后端对接文档

> 本文档面向工程师，详尽说明 NovaMem 前端面板如何从 mock 模式切换到 live 模式接入真实后端、各模块的接口契约、SSE/WS 流转规范、错误降级与多租户/链路追踪机制。
>
> 配套基线：《前端面板需求设计文档》《业务架构设计文档》《技术架构设计文档》。

---

## 1. 总览：三模式数据层

前端从一开始就将数据获取抽象在 `lib/api/` 之下；组件层不直接 `import` mock 文件，而是通过 SWR hooks 取数。这一层根据 `NEXT_PUBLIC_DATA_MODE` 环境变量在三种模式之间切换：

| 模式 | 行为 | 用途 |
| --- | --- | --- |
| `mock` (默认) | hook 调用本地内存数据，叠加可配置延迟 (`NEXT_PUBLIC_MOCK_LATENCY_MS`)，模拟 loading | UI 演示、UI 单元开发、设计评审、e2e mock |
| `bff` ⭐ **日常联调主战场** | hook 走同源 `/api/v1/...` → Next.js Route Handler 收口；部分调真实 NovaMem 后端、部分 mock 兜底；响应头携带 `X-Data-Source` / `X-Mock-Data` / `X-Mock-Fields` 让前端 UI 显式标识数据真实度 | 与真实后端 NovaMem 联调，灰度过渡期 |
| `live` | hook 直连远端独立网关（需后端补齐 18 端点） | 远期，独立 BFF 服务部署 |

切换的关键点位都集中在 `lib/api/config.ts` 与 `lib/api/hooks.ts`，组件无需改动即可享受切换能力。

### 1.1 数据真实度可视化

每个使用 hook 的页面右上角通过 `<DataSourceBadge>` 显示数据来源：

- 🟢 **REAL · NovaMem** — 数据完全来自真实后端
- 🟡 **REAL + MOCK** — hybrid 模式，部分字段真实部分 mock（hover 可见具体 mock 了哪些字段、为什么）
- ⚫ **MOCK** — 全部为本地静态数据

`X-Data-Source` 响应头是这套标识的源头，由 BFF Route Handler 通过 `lib/api/_route-helpers.ts` 中的 `jsonResponse(body, { source, mockFields, mockReason })` 统一注入。

---

---

## 1.5 BFF 模式 · 适配 NovaMem 真实后端

> 前端期望 18+ 个 REST + 1 SSE，NovaMem 真实只有 `GET /health` / `POST /v1/memories` / `POST /v1/recall` 3 个端点。BFF 适配层让前端 UI 零改动即可联调。

### 1.5.1 关键文件

```
app/api/v1/**/route.ts             # 17 个 Route Handler 收口前端期望的所有端点
lib/api/_novamem-client.ts         # callNovamem() 包装：5s 超时 + AbortController + 错误归一
lib/api/_tenant-map.ts             # X-Tenant-Id 中文 → 后端 user_id 的双向映射字典
lib/api/_mock-source.ts            # 唯一服务端 mock 入口 (import 'server-only')
lib/api/_route-helpers.ts          # jsonResponse + 统一 trace/data-source 头注入
lib/api/adapters/novamem.ts        # NovaMem RecallResult ↔ 前端 MemoryRecord 类型映射
scripts/mock-novamem.mjs           # 40 行 Node 进程，占 8001 端口模拟 NovaMem
```

### 1.5.2 三种联调形态

**形态 A · `dev:bff:fake` · 零外部依赖（开发首选）**

```bash
npm run dev:bff:fake
# BFF_USE_MOCK_BACKEND=1 时，_novamem-client.ts 不发真实 HTTP，
# 用内置 fixture 模拟上游响应。整个适配链路（Header 映射、类型转换、响应头注入）
# 完全跑过，无需 Python 环境。
```

**形态 B · `npm run mock-backend` + `dev:bff` · 走真实 HTTP**

```bash
# 终端 1
npm run mock-backend
# [mock-novamem] listening on http://localhost:8001
# 实现了 /health / POST /v1/memories / POST /v1/recall / GET /v1/admin/recall-logs(/:id)

# 终端 2
npm run dev:bff
# BFF 真打 8001，验证完整网络栈（超时、AbortController、错误归一）
```

**形态 C · `dev:bff` 对接真实 NovaMem 服务**

```bash
# 在 .env.local 配置真实后端地址
echo "NOVAMEM_BASE_URL=http://novamem.internal:8001" >> .env.local
npm run dev:bff
```

### 1.5.3 端点适配矩阵

| 前端期望 | NovaMem 实际 | BFF 适配方式 | 数据真实度 |
| --- | --- | --- | --- |
| `GET /api/v1/health` | `GET /health` | 透传 + 字段扩展 | REAL |
| `GET /api/v1/memory/vault` | `POST /v1/recall` | Header X-Tenant-Id → body scope；空 q 用万能 query "*" | HYBRID |
| `GET /api/v1/memory/:id` | 无 | mock 兜底 | MOCK |
| `POST /api/v1/memory/ingest` | `POST /v1/memories` | 透传 + 注入 user_id | REAL |
| `GET /api/v1/analytics/dashboard` | 部分（/health 派生 1 个真实节点） | 聚合 + 标 mock fields | HYBRID |
| `GET /api/v1/analytics/{kpi,throughput,latency,category,ttl}` | 无 | mock 兜底 | MOCK |
| `GET /api/v1/analytics/nodes` | `/health` 探活 | 真实 NovaMem 节点 + mock 节点 | HYBRID |
| `GET /api/v1/schema/*` | 无 | mock 兜底（schema 进化是产品概念） | MOCK |
| `GET /api/v1/evolution/stream` (SSE) | 无 | BFF 自己生成 SSE 流（surprise_alert + reasoning_chunk + schema_diff + ping） | MOCK |
| `GET /api/v1/graph/pipeline` | `/health` 探活 | 首节点 state 由探活动态决定 | HYBRID |
| `GET /api/v1/graph/causal` | 无（graph_db 预留） | mock 兜底 | MOCK |
| `GET /api/v1/traces` | `GET /v1/admin/recall-logs` | RecallLog → TraceSummary，意图分类在 BFF 内做 | HYBRID |
| `GET /api/v1/traces/:id` | `GET /v1/admin/recall-logs/:id` | 单条 RecallLog → 5 个虚拟 Span（按经验比例分配总耗时） | HYBRID |

### 1.5.4 多租户机制

前端 `NEXT_PUBLIC_TENANT` 是**中文展示名**（如 `理财部 · Wealth-01`），通过 `X-Tenant-Id` Header 发送。

BFF 的 `lib/api/_tenant-map.ts` 维护双向字典：

```ts
'理财部 · Wealth-01' ↔ 'wealth-01'
'信贷部 · Credit-02' ↔ 'credit-02'
'研究院 · Lab-A'     ↔ 'lab-a'
```

请求到达 BFF：`tenantToUserId('理财部 · Wealth-01') = 'wealth-01'` 写入 body `scope.user_id`。
响应回灌：`userIdToTenant(result.memory.scope.user_id) = '理财部 · Wealth-01'` 填到 `MemoryRecord.tenant`。

字典未命中时，`slugify` 兜底（小写 + 去标点）。

### 1.5.5 server-only 守卫

`NOVAMEM_BASE_URL` 与 `BFF_USE_MOCK_BACKEND` **没有** `NEXT_PUBLIC_` 前缀，仅 server runtime 可见。`lib/api/_mock-source.ts` / `_novamem-client.ts` / `_tenant-map.ts` 头部 `import 'server-only'`，谁在 client component 引用即 build 失败，防内网地址泄漏到客户端 bundle。

验证命令（应无输出）：
```bash
grep -rn "NOVAMEM_BASE_URL" .next/static
grep -rn "BFF_USE_MOCK_BACKEND" .next/static
```

### 1.5.6 后端待补端点（已写入 PR/issue）

**P0（解锁联调）**：
- `GET /v1/admin/recall-logs?limit=&from=&to=&agent_id=`
- `GET /v1/admin/recall-logs/{id}`
- `/health` 扩展返回 `{ milvus_lite_ok, sqlite_ok, uptime_s, memory_count, cpu_pct, mem_pct }`
- 入站 `X-Trace-Id` 落 RecallLog/MemoryItem metadata

**P1（提升真实度）**：
- `GET /v1/memories?scope=&limit=&cursor=` 列表查询
- `GET /v1/memories/{id}` 单条详情
- `GET /v1/admin/stats` 综合指标

**P2（产品概念落地）**：
- `MemoryItem.semantic_category` 字段对齐前端 4 分类
- WebSocket/SSE 推送 evolution 事件
- 实现 `graph_db/` 模块

---

## 2. 启动矩阵 · 让真后端跑起来

### 2.1 命令一览

```bash
# 开发
npm run dev               # = mock 模式 (默认，无需后端)
npm run dev:mock          # 显式 mock 模式
npm run dev:bff           # bff 模式，需配套启动 NovaMem 或 mock-novamem.mjs
npm run dev:bff:fake      # bff 模式，BFF 内短路上游，**零外部依赖** ⭐ 主调试入口
npm run dev:live          # ⇒ live 模式，直连远端独立网关

# 生产构建
npm run build        # mock 模式 (默认，用于纯演示部署)
npm run build:live   # live 模式
npm run start:live   # 生产模式启动 live 服务

# 通用
npm run typecheck
npm run lint
```

`dev:live` / `build:live` 依赖 `cross-env`，已加入 devDependencies，Windows / Linux / macOS 全平台通用。

### 2.2 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

```ini
# 数据模式：mock | live
NEXT_PUBLIC_DATA_MODE=live

# Go 网关 base URL（生产建议同源代理，避免 CORS）
NEXT_PUBLIC_API_BASE_URL=https://gateway.hypermemory.internal

# 默认租户 ID（注入到 X-Tenant-Id）
NEXT_PUBLIC_TENANT=wealth-01

# SSE 真实模式开关；false 时即使 live 模式也使用本地打字机模拟
NEXT_PUBLIC_SSE_LIVE=true

# mock 模式下的人为延迟（毫秒）
NEXT_PUBLIC_MOCK_LATENCY_MS=180
```

> Next.js 自动按优先级加载：`.env.local` > `.env.development` > `.env`。`NEXT_PUBLIC_*` 前缀的会注入到客户端 bundle；其他变量仅在 server runtime 可见。

### 2.3 三种部署形态

| 部署形态 | 推荐命令 | 备注 |
| --- | --- | --- |
| **纯演示** | `npm run build && npm run start` | mock 模式，无需后端 |
| **联调** | `NEXT_PUBLIC_API_BASE_URL=http://staging-gw npm run dev:live` | 本地起前端、远端 Go 网关 |
| **生产** | `npm run build:live && npm run start:live` (推荐放在容器/PM2) | 配合 nginx 同源代理 |

---

## 3. 数据流总览

```
┌────────────────────────────────────────────────────────────┐
│  NovaMem Frontend (Next.js)                            │
│                                                            │
│   组件 ─→ lib/api/hooks (SWR)                             │
│             │                                              │
│             ├─ IS_LIVE? ──┬─ lib/api/fetcher (REST)        │
│             │             └─ EventSource (SSE)             │
│             └─ MOCK ─────── lib/mocks/*.ts                 │
└────────────────────────────────────────────────────────────┘
                            │ X-Trace-Id, X-Tenant-Id, JWT
                            ▼
┌────────────────────────────────────────────────────────────┐
│  Go 网关 (Gin/Fiber) · 鉴权 · 限流 · TraceID 注入 ·         │
│                       基础面板 CRUD · SSE 反代              │
└──────────────┬───────────────────────────┬────────────────┘
               │ gRPC/REST                 │ 直连
               ▼                           ▼
┌──────────────────────────────┐  ┌─────────────────────────┐
│ Python 引擎 (FastAPI)        │  │ PostgreSQL / Redis      │
│ · 记忆建模 · TPO · Rerank   │  │ 多租户 / 结构化画像     │
│ · 滑窗提取 · 反事实推演     │  └─────────────────────────┘
└──────────────┬───────────────┘
               │ Milvus SDK
               ▼
┌──────────────────────────────────────────────────────────┐
│  Milvus 2.6.8 · 向量索引 · ANN 检索                       │
└──────────────────────────────────────────────────────────┘
```

---

## 4. 完整 API 契约

下文 path 均相对于 `NEXT_PUBLIC_API_BASE_URL`。所有请求必须包含：
- `Content-Type: application/json`
- `X-Tenant-Id: <tenant>` （前端 fetcher 自动注入）
- `X-Trace-Id: tr_<hex>_<rand>` （前端 fetcher 自动生成）
- `Authorization: Bearer <JWT>` （生产部署接入 IAM 后由 nginx 或 BFF 注入）

### 4.1 记忆金库

#### `GET /api/v1/memory/vault`

查询参数：

| Param | Type | 必选 | 说明 |
| --- | --- | --- | --- |
| `q` | string | 否 | 关键词，跨 summary/tags/triggers/sessionId 模糊匹配 |
| `category` | enum | 否 | `事实记忆 \| 语义记忆 \| 画像规则 \| 情景记忆` |
| `agent_id` | string | 否 | 按 Agent 维度过滤 |
| `page` | int | 否 | 从 1 开始，默认 1 |
| `page_size` | int | 否 | 默认 50，最大 200 |

响应：

```ts
{
  items: MemoryRecord[],
  total: number,
  page: number,
  page_size: number,
}

interface MemoryRecord {
  id: string;             // 'mem_8f02a1'
  sessionId: string;      // 'sess_2026-05-22-0091'
  agentId: string;        // 'agent-101'
  tenant: string;
  category: '事实记忆' | '语义记忆' | '画像规则' | '情景记忆';
  summary: string;
  tags: string[];
  triggers: string[];
  ttlHours: number;
  createdAt: string;      // 'YYYY-MM-DD HH:mm'
  confidence: number;     // 0..1
}
```

#### `GET /api/v1/memory/:id`

记忆详情（前端侧滑面板使用）。响应同上 `MemoryRecord`，可额外携带 `rawMarkdown` 字段供深入查看。

### 4.2 运行大盘

| Endpoint | 用途 | 响应 schema |
| --- | --- | --- |
| `GET /api/v1/analytics/kpi` | 顶部 4 张 KPI 卡 | `[ { label, value, delta, positive } ]` |
| `GET /api/v1/analytics/throughput?range=24h` | 吞吐时序 | `[ { t: 'HH:mm', v: number } ]` |
| `GET /api/v1/analytics/latency?range=24h` | 网关 P99 延迟时序 | 同上 |
| `GET /api/v1/analytics/category` | 记忆分类构成饼图 | `[ { name, value, color } ]` |
| `GET /api/v1/analytics/nodes` | 存储节点健康度 | `[ { node, cpu, mem, status: 'healthy'\|'warn' } ]` |
| `GET /api/v1/analytics/ttl?range=7d` | TTL 回收柱图 | `[ { day, total, reclaimed } ]` |

前端会并发拉取以上 6 个端点（`useAnalytics()` 内部 `Promise.all`），建议网关侧也提供一个聚合端点 `GET /api/v1/analytics/dashboard` 一次性下发，减少首屏请求数。

### 4.3 Schema 进化车间

#### `GET /api/v1/schema/tree`

返回当前激活的 Schema 树，结构对应 `SchemaNode[]`：

```ts
interface SchemaNode {
  id: string;
  type: 'skill' | 'general';
  name: string;
  version: string;
  status: 'stable' | 'evolving' | 'draft';
  children?: SchemaNode[];
}
```

#### `GET /api/v1/schema/drafts`

返回所有待审批 / 进化中的提案列表。

#### `GET /api/v1/schema/drafts/:id`

单份 draft 详情：

```ts
interface SchemaDraft {
  id: string;
  nodeId: string;             // 关联到树节点的 id
  title: string;
  surprise: number;           // 惊喜度 0..1
  triggeredBy: string;        // 触发原因描述
  oldMarkdown: string;
  newMarkdown: string;
  status: 'AWAITING_APPROVAL' | 'ACCEPTED' | 'REFINED';
  createdAt: string;
}
```

#### `POST /api/v1/schema/drafts/:id/accept`

落盘采纳。Body 可携带审批人备注：

```json
{ "comment": "周末场景规则合理，采纳。" }
```

响应 `204 No Content` 或携带新生效的 Schema 版本号：

```json
{ "version": "v3.3.0", "appliedAt": "2026-05-22T18:31:00Z" }
```

#### `POST /api/v1/schema/drafts/:id/refine`

驳回并触发 Python 引擎二次推理：

```json
{ "comment": "周末时段过严，请收窄到 14:00 后。" }
```

响应 `204` 或返回新的 draft id。

#### `GET /api/v1/evolution/stream` *(SSE)*

辩证推理流式推送，**这是整套系统最关键的实时通道**。详见第 5 节。

### 4.4 认知拓扑

| Endpoint | 用途 | 响应 |
| --- | --- | --- |
| `GET /api/v1/graph/pipeline` | 管道泳道实时状态 | `PipelineStage[]` |
| `GET /api/v1/graph/causal?user_id=&time=` | 因果图谱节点与边 | `{ nodes: CausalNode[], edges: CausalEdge[] }` |

```ts
interface CausalNode {
  id: string;
  label: string;
  kind: 'user' | 'fact' | 'skill' | 'counterfactual' | 'rule';
}
interface CausalEdge {
  source: string;
  target: string;
  counterfactual?: boolean;
  weight?: number;      // 负值表示抑制
}
```

> 生产环境的图谱响应会非常大，建议网关默认返回**聚合视图**，前端通过 `?cluster=1` 与 `?depth=2` 控制下钻粒度。详见 `PRODUCTION_ROADMAP.md`。

### 4.5 召回 X 光机

#### `GET /api/v1/traces`

查询参数：

| Param | Type | 说明 |
| --- | --- | --- |
| `agent_id` | string | 按 Agent 维度过滤 |
| `status` | `ok \| warn \| error` | 按状态过滤 |
| `from` / `to` | ISO 时间 | 时间区间 |
| `min_ms` / `max_ms` | int | 总耗时区间过滤 |
| `page` / `page_size` | int | 分页 |

响应：

```ts
interface TraceSummary {
  traceId: string;
  intent: string;       // 'recommend' / 'ask' / 'recommend+ask' / 'search'
  totalMs: number;
  status: 'ok' | 'warn' | 'error';
  startedAt: string;
  agentId: string;
}
```

#### `GET /api/v1/traces/:traceId`

完整 span 列表：

```ts
interface TraceSpan {
  module: string;       // 'Go · Gateway' / 'Python · TPO' / 'Milvus · shard-02' ...
  operation: string;
  durationMs: number;
  start: number;        // 相对于 trace 起点的偏移 ms
  status: 'ok' | 'warn' | 'error';
  detail?: Record<string, unknown>;
}
```

---

## 5. SSE 事件协议 · Schema 进化车间

### 5.1 连接

```js
const sse = new EventSource(`${API_BASE_URL}/api/v1/evolution/stream`, {
  withCredentials: true,
});
```

cookie 模式适合同源部署；跨域时建议网关返回 `Set-Cookie` 并配置 `Access-Control-Allow-Credentials: true`。也可改用 `fetchEventSource` 第三方库支持 Authorization 头。

### 5.2 事件定义

| event | 时机 | data schema |
| --- | --- | --- |
| `surprise_alert` | 滑动窗口提取器检测到惊喜度超阈值 | `{ "draftId": "...", "surprise": 0.91, "triggeredBy": "..." }` |
| `reasoning_chunk` | LLM 增量推理字符 | `{ "draftId": "...", "chunk": "...", "seq": 12 }` |
| `schema_diff` | 推理终态，下发完整 diff | `{ "draftId": "...", "old_schema": "...", "new_schema": "...", "status": "AWAITING_APPROVAL" }` |
| `stream_error` | 上游异常 | `{ "code": "LLM_TIMEOUT", "message": "..." }` |
| `ping` | 心跳，30s 一次防代理切断 | `{ "ts": 1716393600 }` |

### 5.3 前端集成（替换打字机模拟）

`components/evolution/ReasoningStream.tsx` 当前使用 `setTimeout` 模拟。接入真实 SSE 的最小改动：

```tsx
useEffect(() => {
  if (!SSE_LIVE) return;
  const sse = new EventSource(`${API_BASE_URL}${ENDPOINTS.schema.stream}`, { withCredentials: true });
  sse.addEventListener('reasoning_chunk', (e) => {
    const { chunk } = JSON.parse((e as MessageEvent).data);
    appendChunk(chunk);
  });
  sse.addEventListener('schema_diff', (e) => {
    const payload = JSON.parse((e as MessageEvent).data);
    onDraftReady(payload);
  });
  sse.onerror = () => sse.close();
  return () => sse.close();
}, []);
```

### 5.4 降级策略

- SSE 连接失败或断连 → 自动回退到 `GET /api/v1/schema/drafts` REST 长轮询（每 5s 一次）
- 浏览器不支持 EventSource（IE11 等）→ 同上回退
- 网关无 SSE 路由 → 检测到 404 后启用 mock 打字机演示模式

---

## 6. 模块迁移配方（最小 diff）

### 6.1 记忆金库 *(已完成)*

`VaultExplorer.tsx` 已切换为 `useVaultMemories()` hook，可直接 `npm run dev:live` 验证。

### 6.2 运行大盘

```diff
- import { MOCK_KPI_CARDS, ... } from '@/lib/mocks/analytics';
+ import { useAnalytics } from '@/lib/api/hooks';

  export function AnalyticsDashboard() {
+   const { data, isLoading, error } = useAnalytics();
+   if (!data) return <Skeleton />;
+   const { kpi, throughput, latency, category, nodes, ttl } = data;
    // 后续渲染逻辑保持不变
  }
```

### 6.3 Schema 进化车间

`EvolutionFactory.tsx`：
1. 替换 `MOCK_DRAFTS` 为 `useSchemaTree()` + `useSchemaDrafts()` 两个 hook（需在 `lib/api/hooks.ts` 新增）。
2. 替换 `ReasoningStream` 内的 `setTimeout` 模拟为 EventSource，见 5.3。
3. 把 `setStatusMap` 的修改改为 `fetcher(ENDPOINTS.schema.accept(id), { method: 'POST' })`，根据返回结果更新本地状态。

### 6.4 认知拓扑

`CognitiveGraphPage`：
```diff
- import { MOCK_CAUSAL_EDGES, MOCK_CAUSAL_NODES, MOCK_PIPELINE } from '@/lib/mocks/graph';
+ import { useGraphData } from '@/lib/api/hooks';

- <PipelineLanes stages={MOCK_PIPELINE} />
- <CausalGraph nodes={MOCK_CAUSAL_NODES} edges={MOCK_CAUSAL_EDGES} />
+ const { data } = useGraphData();
+ <PipelineLanes stages={data?.pipeline ?? []} />
+ <CausalGraph nodes={data?.causal.nodes ?? []} edges={data?.causal.edges ?? []} />
```

### 6.5 召回 X 光机

`RetrievalXRay.tsx`：
```diff
+ const { data: traces } = useTraceList();
+ const { data: spans } = useTraceDetail(activeTrace);

- MOCK_TRACE_HISTORY.map(...)
+ (traces ?? []).map(...)
```

---

## 7. 错误处理 / 降级 / 重试

- 所有 fetcher 在 `4xx`/`5xx` 抛 `ApiError(status, payload)`，SWR 默认不自动重试（`shouldRetryOnError: false`）。
- 推荐在 hook 调用方使用三态渲染：`isLoading` 骨架屏 → `error` 错误卡 → 数据渲染。
- SSE 断连：监听 `onerror` 后 `setTimeout(reconnect, backoffMs)`，最大 3 次指数退避，最后回退到 REST 轮询。
- 网关 5xx 时 vault/analytics 应显示**最后一次成功的缓存**（SWR 默认行为），并在右上角显示「数据可能延迟」红点。

---

## 8. 鉴权与多租户

- 生产环境推荐：前端不直接持有 JWT；登录由 BFF/网关托管，cookie HttpOnly + SameSite=Lax。
- 多租户：所有请求带 `X-Tenant-Id`；网关侧负责把 tenant 路由到对应的 Milvus collection / Postgres schema。
- 切换租户：在 Zustand store 中调用 `setTenant(...)` 后，所有 SWR key 会因 tenant 变化重新拉取（建议把 tenant 纳入 SWR key 中）。

---

## 9. 链路追踪 (Trace) 规范

- 前端 fetcher 自动注入 `X-Trace-Id: tr_<hex>_<rand>`；同一次用户操作中的多个并发请求**共享同一个 traceId**（可由调用方显式传 `traceId`）。
- 网关读到 traceId 后通过 OpenTelemetry 透传到 Python、Milvus、Postgres。
- 召回 X 光机的 trace 列表与详情都基于这个 id 聚合。
- 前端会把最近一次 traceId 存到 `sessionStorage` 的 `hm-last-trace-id`，便于调试时一键检索。

---

## 10. 验收清单

接入完成时，下面这张表应该全部 ✅：

- [ ] `npm run dev:live` 启动后，记忆金库右上角出现「LIVE · Go 网关」蓝色 Chip
- [ ] 切换租户 / Agent，SWR 重新发请求（network 面板可见）
- [ ] 强制断网时，已有数据保留 + 显示「接口异常」提示
- [ ] Schema 进化车间真实 SSE 推流，打字机有 reasoning_chunk
- [ ] 召回 X 光机能根据真实 traceId 拉到 spans 详情
- [ ] 所有请求 Header 含 `X-Trace-Id` 与 `X-Tenant-Id`

如需细节调整或扩展新模块，统一在 `lib/api/hooks.ts` 增加 hook，避免组件内零散散落 `fetch`。
