# NovaMem · 进阶面板生产化演进 Roadmap

> 本文档面向架构师与高级前端工程师，讨论 **认知拓扑引擎** 与 **召回 X 光机** 两个进阶面板从当前演示原型到面对真实生产环境（千万级用户、每秒千级请求、海量图谱节点）所需的设计演进与工程路径。

---

## 1. 总览：原型到生产的 5 个本质矛盾

| # | 矛盾 | 体现 |
| --- | --- | --- |
| 1 | **数据规模**：mock 几十节点 vs 真实千万级 | 整图加载会卡死浏览器、网络耗时高 |
| 2 | **观察单位**：演示按"单用户" vs 生产按"用户群" | 个体节点对运营/架构师价值低，缺少聚合视角 |
| 3 | **时效**：原型是静态快照 vs 生产需要实时增量 | 全量重绘 = 60fps 杀手 |
| 4 | **信噪比**：原型默认全部展示 vs 生产需要筛掉 99% 噪声 | 找 Bad Case 像大海捞针 |
| 5 | **可干预性**：原型只读 vs 生产需要审计、回放、A/B | 操作需要落审计日志，避免人为错改 |

下面两章分别按"原型差距 → 设计目标 → 分阶段实施"展开。

---

## 2. 认知拓扑引擎 · 生产演进

### 2.1 当前原型差距

`components/graph/CausalGraph.tsx` 当前用纯 SVG 渲染十余个节点，按节点类型分层并支持拖拽。这套实现的边界：

- ≤ 200 节点流畅，500+ 节点开始掉帧，5000+ 节点无法挂载。
- 节点位置是静态分层，缺乏力导布局；高密度时会重叠。
- 无下钻能力：只能看到此次返回的全部节点，无法折叠/展开。
- 无 diff 视图：图谱演化无法对比。
- 拖拽改动不会持久化，没有审计与回放。

### 2.2 设计目标

- **百万节点级别**仍保持 60fps 主观流畅。
- **从聚合到个体**的三级下钻：群体 → 子群 → 个体。
- 实时反映 Python 引擎的滑窗提取 / 反事实推演**增量**事件。
- 架构师的图谱干预产生**可审计、可回放**的事件流。

### 2.3 设计演进 · 分阶段路线

#### 阶段 A · 渲染引擎升级（必做）

- 将 SVG 替换为 **AntV G6 v5 + WebGL renderer**。文档技术架构里已选 G6，原型只是预留位。
- 节点 > 5000 时自动切换到 G6 **Cluster Mode**：把同社区的节点合并为一个聚合节点，hover 展开预览，双击下钻。
- 边宽用 `weight` 编码，反事实链路保持紫色虚线。
- 实测下：G6 + Canvas 渲染 10k 节点 + 30k 边 在 M1 Mac 稳定 60fps。

#### 阶段 B · 三视图切换

```
┌─────────────────────────────────────────────────────────┐
│  [群体视图] [个体视图] [时序视图]                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   群体视图：按租户 × 用户簇 × Skill 类目 聚合          │
│   - 节点 = 一个用户群（含人数、平均置信度）            │
│   - 边 = 群间共享的 Skill / 偏好                       │
│   - 适合：架构师做策略评估                              │
│                                                         │
│   个体视图：单个 user_id 的完整因果链                  │
│   - 节点 = 用户、事实、Skill、反事实、规则             │
│   - 适合：运营定位单点 Bad Case                        │
│                                                         │
│   时序视图：选两个时间点的图谱 Diff                    │
│   - 新增节点高亮绿，废弃节点高亮红                     │
│   - 适合：复盘 Schema 进化效果                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### 阶段 C · 左侧过滤面板（取代当前的"全图无筛选"）

| 维度 | 控件 | 后端参数 |
| --- | --- | --- |
| 租户 | 多选 | `tenant_id[]` |
| 时间 | 时间区间选择器 | `from`/`to` |
| Agent | 多选 | `agent_id[]` |
| 节点类型 | Checkbox 组 | `kind[]` |
| 置信度阈值 | 双向滑块 | `confidence_gte`/`lte` |
| 反事实链路 | Switch | `include_counterfactual` |
| 最小节点连接度 | Number | `min_degree` |

所有过滤项变化都通过 SWR 重新触发 `useGraphData()`，后端按需要返回**聚合视图**。

#### 阶段 D · 实时增量

原型用 REST 拉整图，生产应改为 WebSocket：

```
ws://gateway/api/v1/graph/subscribe?tenant=...&user_group=...

event: node_added       → 新增节点
event: edge_updated     → 边权变化
event: counterfactual   → 新增反事实推演结果
event: schema_applied   → Schema 落地生效，图谱重排
```

前端使用 G6 的 `graph.changeData({ nodes: [...newNodes], edges: [...] })` 做增量 patch，避免全量重绘。

#### 阶段 E · 节点详情侧滑

点击节点弹出右侧 384px Drawer，分四个 Tab：

1. **基本信息**：id, kind, 创建时间, 置信度, TTL
2. **事实链**：上溯到根用户的 fact 路径（树形）
3. **反事实**：所有因果反推记录（含触发条件、推演结论）
4. **影响范围**：该节点参与的所有 Skill / Rule（含权重）

#### 阶段 F · 干预审计 & 回放

- 拖拽节点、断开边、修改权重 → 全部封装为一条 `intervention_log` 事件，含 `userId`、`timestamp`、`before/after diff`。
- 上方加"时间轴"控件，拉动可回放任意时间点的图谱形态。
- 操作前出 confirm dialog，权重 / Rule 类节点的修改必须二人审批（前端走多人签名）。

#### 阶段 G · 异常检测面板

右上角浮窗实时显示：

```
异常监测 · 近 10 分钟
─────────────────────
⚠ 节点突增  +4,217 (+23%)
⚠ 反事实链路异常聚集（5个用户群 → 同一规则）
✓ 置信度分布正常
```

后端按规则订阅图谱事件，触发阈值后推 WebSocket。

### 2.4 接口契约扩展（建议网关侧补充）

```
GET  /api/v1/graph/causal/aggregate          // 聚合视图
GET  /api/v1/graph/causal/individual/:userId // 个体视图
GET  /api/v1/graph/causal/diff?from=&to=     // 时序 diff
WS   /api/v1/graph/subscribe                 // 实时事件流
POST /api/v1/graph/intervention              // 干预日志写入
GET  /api/v1/graph/intervention/history      // 干预回放
POST /api/v1/graph/intervention/replay       // 干预重做
```

### 2.5 实施优先级建议

| 优先级 | 阶段 | 业务价值 | 工程量 |
| --- | --- | --- | --- |
| P0 | A 渲染引擎 + B 三视图 | 决定能不能跑生产 | 高（2–3 周） |
| P1 | C 过滤面板 + E 节点详情 | 决定运营效率 | 中（1 周） |
| P1 | D 实时增量 | 决定实时性 | 中（1 周，需后端 WS） |
| P2 | F 审计回放 + G 异常检测 | 决定合规与可运营性 | 高（合规联调 2 周） |

---

## 3. 召回 X 光机 · 生产演进

### 3.1 当前原型差距

`components/xray/RetrievalXRay.tsx` 当前展示 5 条 mock trace 列表 + 单条 trace 的瀑布流 + Span JSON 侧滑。生产环境真实数据流：

- 每个用户每次问答都会产生 1 条 trace，包含 6–15 个 spans。
- 单 Agent 高峰期 1k QPS → 每秒 1000 条 trace 生成。
- 7 天保留 = 数十亿 spans，全部展示既不现实也无意义。
- 真正有价值的是：**Bad Case 定位**（错误 trace 的快速归因）与 **性能回归**（突发高延迟的根因分析）。

### 3.2 设计目标

- **百万 trace/天** 量级下做到秒级响应。
- 默认呈现的不是 trace 列表，而是**聚合分布**（按耗时桶、错误码、模块）。
- 提供从聚合 → 单 trace → 单 span 的下钻链路。
- 单 trace 详情承载比"瀑布流"更深的信息：火焰图、TPO 决策树、召回结果对比。

### 3.3 设计演进 · 分阶段路线

#### 阶段 A · 顶部聚合大盘（必做，替换当前 5 卡片）

```
┌──── 召回 X 光机 ────────────────────────────────────────────┐
│                                                            │
│  时间范围 [近 1 小时 ▾]  租户 [Wealth-01 ▾]  Agent [全部▾] │
│                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ 总 trace │ │  错误率   │ │ P99 耗时 │ │ TPO 触发率│      │
│  │ 4,712,031│ │  0.21%   │ │  138 ms  │ │  17.8%   │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                            │
│  耗时分布直方图（横轴 ms，纵轴 trace 数）                  │
│  ─────────────────────────────────────                    │
│  柱状图：< 50ms │ 50-100ms │ 100-200ms │ > 200ms          │
│  点击柱条 → 下钻到该桶的 trace 列表                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

#### 阶段 B · Bad Case 自动归类

后端按错误模式聚类，前端用卡片网格展示：

```
┌────────────────────────────────────────────────────────┐
│  Bad Case · 近 1 小时                                  │
├────────────────────────────────────────────────────────┤
│  ⚠ Milvus shard-02 向量超时        128 起 · 平均 320ms │
│  ⚠ TPO 推理超时                    47 起  · 平均 1.2s  │
│  ⚠ Rerank Score 异常 (< 0.1)      89 起  · 平均 87ms  │
│  ⚠ 上游 LLM 429 限流              13 起  · 平均 240ms │
└────────────────────────────────────────────────────────┘
```

点击某一类 → 跳转到带预设过滤的 trace 列表 → 查看代表性 Bad Case 详情。

#### 阶段 C · Trace 列表升级（虚拟滚动）

替换当前的固定 5 卡片：

- 表格形式，行高 36px，react-window 虚拟滚动支持 10 万行。
- 默认按 `started_at DESC` 排序，可改按耗时、状态。
- 列：trace_id（截断） · intent · agent · 耗时分布迷你直方图 · 状态 · 时间。
- 鼠标 hover 显示完整 traceId 与"复制"按钮。
- 多选 + 顶部"对比"按钮 → 进入 A/B 对比视图（详见 D）。

#### 阶段 D · 单 trace 详情升级（核心价值点）

当前只有瀑布流 + Span JSON。生产版加 4 个新视图：

##### D1. 火焰图（FlameGraph）

不仅看 span 时间分布，更看**调用嵌套关系**。同一 Span 内可包含子 Span（如 Python · TPO 内部多次调用 LLM）。

##### D2. TPO 决策树

把 TPO 推理过程白盒化：

```
TPO 干预决策
├─ 输入特征
│   ├─ 用户.风险等级 = R2
│   ├─ 用户.净资产 = 620万
│   └─ 上下文.最近行为 = [拒绝 × 3]
├─ 命中规则
│   ├─ R1: 周末时段高净值避险 → 冻结激进推荐 (priority=10)
│   └─ R2: 连续拒绝衰减 → 类目权重 ×0.2 (priority=5)
├─ 重排序
│   ├─ 候选 #1: 货币基金A    原始 0.42 → 干预后 0.68
│   ├─ 候选 #2: 股票基金B    原始 0.81 → 干预后 0.16
│   └─ 候选 #3: 短债基金C    原始 0.55 → 干预后 0.71
└─ 最终输出
    ├─ TopK: [短债 C, 货币 A, 货币 D]
    └─ 与原始 TopK Diff: 新增 2 项，剔除 2 项
```

##### D3. 召回结果对比 (Recall Diff)

并排显示「原始向量召回 TopK」与「Rerank + TPO 后 TopK」，标记：
- 🟢 新增项（Rerank 提拔）
- 🔴 剔除项（被去重 / 被 TPO 抑制）
- 🟡 排序变化项

##### D4. 会话级链路

把同一 sessionId 的多个 trace 串成对话级时间线：

```
Session sess_2026-05-22-0091
├─ 14:02:31  Q1: "我想了解一下基金"        128ms ✓
├─ 14:02:58  Q2: "稳健点的有什么推荐"       142ms ⚠ (TPO 触发)
├─ 14:03:24  Q3: "不要股票型"              101ms ✓
└─ 14:03:51  Q4: "好的，那再多介绍下短债"  117ms ✓
```

#### 阶段 E · 采样与压缩

生产侧后端必须做采样，否则前端无法承受：

| 类型 | 保留率 | 用途 |
| --- | --- | --- |
| 全量 trace | 1% | 抽样分析 |
| 错误 trace | 100% | 全部保留 |
| 慢 trace (P99) | 100% | 性能基线 |
| TPO 触发 trace | 100% | 干预审计 |
| 其余 | 丢弃 / 仅保留 head | 节省存储 |

前端在 trace 列表上方显示「数据为 1% 采样 + 100% 异常」的小提示，避免误读。

#### 阶段 F · A/B 对比

多选两条 trace，进入 split view：

- 左右并排瀑布流
- Span 按 module 对齐，差异项高亮
- 用于发布前回归测试：相同 query，新旧版本结果对比

#### 阶段 G · 告警联动 / 一键回放

- 接入告警系统（Prometheus AlertManager / 钉钉 webhook），告警卡里直接附带 traceId 与跳转链接。
- 单 trace 页面右上角"回放到 Staging"按钮，把 trace 完整 query + context dump 提交到 staging 环境重放，对比新代码下的链路是否修复。

### 3.4 接口契约扩展

```
GET  /api/v1/traces/aggregate?dimension=duration|module|error  // 顶部聚合
GET  /api/v1/traces/badcase                                    // Bad Case 聚类
GET  /api/v1/traces?{filters}&cursor=                          // 列表（cursor 分页）
GET  /api/v1/traces/:id                                        // 详情（已存在）
GET  /api/v1/traces/:id/flamegraph                             // 火焰图数据
GET  /api/v1/traces/:id/tpo                                    // TPO 决策树
GET  /api/v1/traces/:id/recall_diff                            // 召回对比
GET  /api/v1/sessions/:sid/traces                              // 会话级链路
POST /api/v1/traces/:id/replay                                 // 回放
```

### 3.5 实施优先级建议

| 优先级 | 阶段 | 业务价值 | 工程量 |
| --- | --- | --- | --- |
| P0 | A 聚合大盘 + C 虚拟列表 | 撑住数据量 | 中（1 周） |
| P0 | B Bad Case 聚类 | 决定问题定位效率 | 中（1.5 周，含后端聚类） |
| P1 | D1 火焰图 + D2 TPO 决策树 | 决定深度排查能力 | 高（2 周，含 OpenTelemetry 嵌套） |
| P1 | D3 召回对比 + D4 会话链路 | 决定召回算法可调优性 | 中（1 周） |
| P2 | E 采样策略（后端） + F A/B | 撑住成本 + 回归测试 | 高（2 周） |
| P2 | G 告警联动 + 回放 | 闭环运维 | 高（2 周，跨系统） |

---

## 4. 通用建议（两块都受益）

1. **性能基线**：所有大数据量列表统一接入 `react-window` / `@tanstack/react-virtual`。
2. **WebSocket 抽象**：在 `lib/api/ws.ts` 沉淀一个 reconnect + heartbeat 包装，认知图谱与召回告警共用。
3. **导出能力**：每个详情页提供「导出 JSON / 截屏」入口（合规审计使用）。
4. **权限粒度**：写操作（干预图谱、采纳 Schema、Trace 回放）需基于角色 RBAC，前端隐藏按钮 + 后端二次校验。
5. **多语言**：当前是中文硬编码，生产应抽取到 `locales/zh-CN.json` / `en-US.json`，使用 `next-intl` 或 `react-intl`。

---

## 5. 不要做的事 (Anti-patterns)

| ✗ 反模式 | 后果 |
| --- | --- |
| 把整图整列表用 REST 一次性拉下来 | 浏览器 OOM、网关压力 |
| 用 setInterval 轮询代替 SSE/WS | 占用 socket、丢失实时性 |
| 把干预操作直接落到生产图谱 | 没有审计、人为错误不可回滚 |
| 在前端做大规模聚类计算 | CPU 干涸，应在 Python/ClickHouse 侧 |
| 让前端持久化 token | XSS 后果灾难，应同源 cookie + HttpOnly |

---

## 6. 与现有代码的接驳点

| 演进项 | 替换 / 新增的文件 |
| --- | --- |
| 渲染引擎升级 | 重写 `components/graph/CausalGraph.tsx` 为 G6 v5 版本 |
| 三视图切换 | 新增 `components/graph/views/{GroupView,IndividualView,TimelineView}.tsx` |
| WebSocket 抽象 | 新增 `lib/api/ws.ts` |
| 聚合大盘 | 新增 `components/xray/AggregateBar.tsx` |
| 虚拟列表 | 把 `RetrievalXRay.tsx` 中的 trace 列表换成 react-window |
| 火焰图 | 新增 `components/xray/FlameGraph.tsx`（基于 echarts treemap 或 d3-flame-graph） |
| TPO 决策树 | 新增 `components/xray/TpoDecisionTree.tsx` |
| 召回对比 | 新增 `components/xray/RecallDiff.tsx` |

---

## 附录 · 推荐技术选型

| 用途 | 选型 | 备选 |
| --- | --- | --- |
| 大图谱渲染 | AntV G6 v5 (Canvas/WebGL) | Cytoscape.js, Sigma.js |
| 火焰图 | d3-flame-graph | speedscope, perfetto-ui |
| 虚拟滚动 | @tanstack/react-virtual | react-window |
| 时序图 | ECharts (已用) | uPlot (极致性能) |
| WebSocket | 原生 + 自封装 reconnect | socket.io（重） |
| 状态机 | XState（用于复杂 SSE 重连 / 审批流） | 不引入，纯 useReducer |
| 监控埋点 | OpenTelemetry-JS + Sentry | LogRocket |
