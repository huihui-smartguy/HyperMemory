# HyperMemory · 企业级记忆系统面板

> 面向大模型 Agent 的元认知记忆中枢前端面板 — 完整可运行原型，Mock 静态数据驱动。
> 严格遵循《前端面板需求设计文档》《业务架构设计文档》《技术架构设计文档》三份基线。

## 启动

```bash
npm install      # 或 pnpm install / yarn
npm run dev      # 默认 http://localhost:3000
npm run typecheck
npm run build && npm run start
```

Node ≥ 18.17。首次启动 Monaco 与 ECharts 会按需懒加载，无需额外配置。

## 模块地图

| 区域 | 路由 | 关键能力 | 关键组件 |
| --- | --- | --- | --- |
| 首页 Hero | `/` | 战略叙事 · 入口分发 · KPI 展示 | `app/page.tsx` |
| 基础 · 记忆金库 | `/basic/vault` | Spotlight 搜索 · 沉浸数据网格 · 实体胶囊 · 详情侧滑 | `components/vault/VaultExplorer.tsx` |
| 基础 · 运行大盘 | `/basic/analytics` | 吞吐 / 延迟折线 · 分类饼图 · TTL 回收柱图 · 节点健康度 | `components/analytics/AnalyticsDashboard.tsx` |
| 进阶 · Schema 进化车间 | `/advanced/evolution` | SSE 推理打字机 · Monaco Diff · 人机审批闭环 | `components/evolution/*` |
| 进阶 · 认知拓扑引擎 | `/advanced/cognitive-graph` | 管道泳道 · 可拖拽因果图谱 · 反事实链路虚线高亮 | `components/graph/*` |
| 进阶 · 召回 X 光机 | `/advanced/retrieval-xray` | Trace 历史 · 链路瀑布流 · Span JSON 侧滑 | `components/xray/RetrievalXRay.tsx` |
| 开发者中心 | `/dev` | 租户上下文 · API 契约 · SSE 事件协议 | `app/dev/page.tsx` |

## UI 语言

- **Apple HIG · 极简白盒**：`#F5F5F7` / `#000000` 背景；`backdrop-blur(20px)` 毛玻璃；`SF Pro` + `PingFang SC` 字体栈；信息层级仅由字重表达。
- **Mega Menu**：顶部悬浮，鼠标进入「基础面板 / 进阶面板」展开二级毛玻璃面板，Framer Motion 缓动 `cubic-bezier(0.22, 1, 0.36, 1)`。
- **实体胶囊**：浅色圆角，仅一个色阶；强调色 `#0071E3`，警示走系统色。
- **暗黑模式**：`html.dark` 切换 + `localStorage` 持久化 + `prefers-color-scheme` 跟随。

## 关键工程决策

1. **Monaco / ECharts 全部 `dynamic({ ssr: false })`**：避免 SSR 触发 DOM API。
2. **因果图谱用 SVG 自实现**：原型期不引入 `@antv/g6` 的运行时（依赖体积/SSR 副作用大），但 `package.json` 保留依赖位以便后续切换为 G6。轻量 SVG 已覆盖文档要求 — 节点、贝塞尔连线、反事实虚线、拖拽。> 5000 节点时建议替换为 G6 Cluster 模式。
3. **SSE 打字机为本地模拟**：`ReasoningStream.tsx` 用 `setTimeout` 复刻流式吐字效果。接入真实后端时只需替换为 `new EventSource('/api/v1/evolution/stream')`，事件名匹配文档定义（`surprise_alert` / `reasoning_chunk` / `schema_diff`）。
4. **状态管理**：`Zustand` (`lib/store.ts`) — 仅承载租户、Agent、TraceID、主题，避免渲染阻塞。
5. **Mock 数据集中**：`lib/mocks/*.ts` 与 `lib/types.ts` 一一映射，便于将来替换为 SWR / React Query 真实接口。

## 后端对接路径（替换 Mock 即可上线）

```
lib/mocks/memories.ts   ←→  GET  /api/v1/memory/vault
lib/mocks/analytics.ts  ←→  GET  /api/v1/analytics/throughput | /latency | /category | /nodes
lib/mocks/schemas.ts    ←→  GET  /api/v1/schema/tree
                            GET  /api/v1/evolution/stream  (SSE)
                            POST /api/v1/schema/accept
lib/mocks/graph.ts      ←→  GET  /api/v1/graph/pipeline | /causal
lib/mocks/traces.ts     ←→  GET  /api/v1/trace/:traceId
```

详见 `/dev` 路由的 API 契约总览。

## 目录

```
app/                    # Next.js App Router 页面
  basic/                # 基础面板（vault / analytics）
  advanced/             # 进阶面板（evolution / cognitive-graph / retrieval-xray）
  dev/                  # 开发者中心
  layout.tsx            # 全局布局 + Mega Menu + 主题引导
components/
  nav/                  # 顶部 Mega Menu + ThemeBoot
  ui/                   # Card / Chip / PageHeader 原子件
  vault/                # 记忆金库
  analytics/            # 运行大盘
  evolution/            # Schema 进化车间（含 Monaco Diff）
  graph/                # 认知拓扑引擎（PipelineLanes + CausalGraph）
  xray/                 # 召回 X 光机（瀑布流）
  charts/               # ECharts client wrapper
lib/
  store.ts              # Zustand 全局状态
  types.ts              # 业务类型定义
  mocks/                # 全部 mock 数据
```

## 非功能性需求落地

| 需求 | 实现位置 |
| --- | --- |
| 暗黑 / 浅色双主题 | `tailwind.config.ts` + `ThemeBoot` + `MegaMenu` 切换按钮 |
| 极致留白 / 发丝线 | `globals.css` 的 `.hm-card / .hm-hairline / .hm-glass` |
| 流式 SSE 降级 | `ReasoningStream` 提供模拟实现，注释说明接入路径 |
| 大图谱聚合 | 当前 SVG 实现 ≤ 200 节点；> 5000 时切到 G6 Cluster |
| 状态全局共享 | `lib/store.ts` 使用 Zustand |

## License

MIT — 见仓库根 `LICENSE`。
