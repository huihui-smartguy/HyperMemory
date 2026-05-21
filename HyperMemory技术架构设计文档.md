# HyperMemory 企业级记忆系统

## 技术架构设计文档 (Technical Architecture v1.0)

本技术架构文档旨在为 HyperMemory 提供从前端极致视觉渲染到后端异构微服务高并发处理的全局技术蓝图。系统采用 **Node.js (前端环境) + Go (高并发网关与基础业务) + Python (深层认知计算)** 的异构微服务架构，以确保系统既能承载海量即时交互，又能完成复杂的自主进化演算。

---

## 1. 总体系统拓扑架构

HyperMemory 的技术栈按照业务职责划分为四大核心层域：

1. **展示层 (UI/UX Layer):** 基于 Next.js (React) 构建，全面贯彻 Apple 官网极简设计语言与悬浮展开式 Mega Menu 交互。
2. **网关与基础业务层 (API & Gateway Layer - Go):** 负责鉴权、高并发路由分发、TraceID 注入以及基础记忆数据的极速 CRUD 操作。
3. **认知与进化引擎层 (Cognitive Engine - Python 3.7.4):** 负责大语言模型调度、TPO/DPO 偏好对齐、辩证推理以及 Schema 进化计算。
4. **混合存储底座 (Data Layer):** 整合 Milvus 2.6.8 (向量存储)、PostgreSQL (结构化存储) 与 Redis (高速缓存与状态同步)。

---

## 2. 前端技术架构与视效实现

前端旨在复刻 mem0 Dashboard 的高密数据承载力，同时在视觉呈现上达到 Apple 级别的极致简约。

### 2.1 核心选型与构建

* **基础框架：** `Next.js (App Router) + TypeScript`。利用 SSR (服务端渲染) 保证首屏加载速度，TS 提供严格的接口类型校验。
* **全局状态管理：** `Zustand`。极其轻量，负责管理当前租户上下文、全局 TraceID 与深色/浅色模式状态。
* **UI 视效引擎：** `TailwindCSS` + `Framer Motion`。
* **Mega Menu 导航实现：** 摒弃侧边栏，顶部导航仅保留文本。使用 Framer Motion 监听 `onMouseEnter` 事件，当鼠标移入“基础面板”或“进阶面板”时，触发下拉动画。下拉面板应用 `backdrop-filter: blur(20px)` 与微白透明背景，实现 Apple 特有的毛玻璃质感与极致留白。
* **字体排印：** 强制定义全局字体栈优先使用系统原生无衬线字体 (`San Francisco, -apple-system, BlinkMacSystemFont`)。



### 2.2 核心业务组件与可视化库

* **基础面板 (稳态数据区)：** 深度定制 `Ant Design` 表格组件，剥离所有冗余边框与斑马纹，使用浅灰细线分隔，实现极致简约的“记忆金库”数据网格。
* **进化车间 (代码级对比)：** 接入 `Monaco Editor (React 版)`。开启 `diffEditor` 模式，前端不负责逻辑，仅接收后端下发的旧版与新版 Markdown 字符串进行差异高亮渲染。
* **召回 X 光机与认知图谱：** 采用 `Apache ECharts` (渲染甘特图模式的链路瀑布流) 和 `AntV G6` (渲染无边框、平滑贝塞尔曲线的因果图谱)。

---

## 3. 后端微服务架构设计

后端采取 **Go + Python** 强强联合的异构模式，实现“计算与 IO”的分离。

### 3.1 Go 微服务 (网关与 IO 密集型引擎)

Go 语言凭借协程（Goroutine）优势，充当整个 HyperMemory 的“交通枢纽”。

* **框架选型：** `Gin` 或 `Fiber`。
* **核心职责：**
* **统一入口与限流：** 承接前台 Agent 所有的搜推问请求，进行 JWT 鉴权与租户隔离。
* **链路追踪 (Tracing)：** 生成全局唯一的 `Trace_ID`，采用 OpenTelemetry 协议打通 Go 与 Python 服务，支持前端“召回 X 光机”的耗时透视。
* **基础面板 CRUD：** 直接连接 PostgreSQL 与 Redis，为前端的基础面板（如记忆统计、历史翻页）提供极速的 RESTful API 响应，完全不占用 Python 计算资源。



### 3.2 Python 微服务 (CPU 密集与大模型引擎)

基于 **Python 3.7.4** 环境，主攻核心算法与认知进化，是 HyperMemory 的大脑。

* **框架选型：** `FastAPI` (原生支持异步，对接大模型 I/O 效率高)。
* **核心职责：**
* **记忆摄入与建模：** 封装 LangChain / LlamaIndex，驱动 LLM 提取业务规则，生成 `Skill记忆Schema`。
* **多路召回与 TPO 引擎：** 直连 **Milvus 2.6.8** 进行向量近似度检索。结合 TPO 算法，在推理期毫秒级计算用户当前状态的环境权重，动态重排 (Rerank) 检索结果。
* **自主维护后台进程：** 运行滑动窗口算法，执行惊喜度打分与反事实因果提取。



---

## 4. 前后端对接规范 (Integration Specifications)

前端与后端的通信协议必须根据业务敏捷度进行严格分流。Go 服务主要提供 REST API，Python 服务通过 Go 代理提供流式响应。

### 4.1 基础面板对接 (RESTful 稳态交互)

适用于“记忆展示”、“统计大盘”等标准表格展示场景。

* **协议栈：** HTTP/1.1 (JSON)。请求直接打到 Go 网关并由 Go 完成闭环。
* **交互规范：** 前端基于 `SWR` 或 `React Query` 封装请求，实现自动缓存与失活轮询，保障极致流畅度。
* **API 样例 (Go 提供)：**
```json
GET /api/v1/memory/vault?agent_id=101&page=1
// 响应：结构化记忆列表，包含 ttl, tags, category 等字段。

```



### 4.2 Schema 进化车间对接 (SSE 流式交互)

当底层触发辩证推理与 Schema 优化时，由于大模型推导耗时长，必须使用 **SSE (Server-Sent Events)** 技术向前端推流，以实现“可见的思考过程”。

* **流转路径：** Python (生成推理流) -> Go (反向代理，保持长连接) -> 浏览器。
* **事件定义规范：**
* `event: surprise_alert` -> 触发高惊喜度预警。
* `event: reasoning_chunk` -> 推理过程字符流，前端打字机渲染。
* `event: schema_diff` -> 推理完成，下发结构化对比数据：



```json
        {
          "old_schema": "### 规则约束\n...",
          "new_schema": "### 规则约束\n... \n[新增 TPO 干预规则]",
          "status": "AWAITING_APPROVAL"
        }
        ```
    *   前端接收到 `schema_diff` 事件后，停止打字机，将 `old_schema` 与 `new_schema` 灌入 Monaco Diff Editor。管理员点击“采纳”后，前端通过标准的 POST (RESTful) 请求将确认的新代码提交给 Go 服务，完成落盘生效。

### 4.3 召回 X 光机溯源对接 (Tracing Pipeline)
为了渲染类似 Chrome DevTools 的瀑布流网络图，必须规范前后端时间轴透传机制。
*   **Trace 透传机制：** Go 网关入口生成 `X-Trace-ID` 并附带在 HTTP Header 或 gRPC Metadata 中传递给 Python 与 Milvus 服务。
*   **聚合下发规范：** 当用户在面板查询某次请求时，Go 服务从日志中心（如 ELK 或 Jaeger）聚合该 Trace ID 下的所有 Span，转化为以下 JSON 阵列下发给前端 ECharts：
    ```json
    [
      { "module": "Go_Gateway", "operation": "auth_routing", "duration_ms": 5, "start": 0 },
      { "module": "Python_TPO", "operation": "intent_classification", "duration_ms": 45, "start": 5 },
      { "module": "Milvus_DB", "operation": "vector_search", "duration_ms": 35, "start": 50 }
    ]
    ```

<FollowUp label="是否需要进一步规划底层的表结构设计？" query="前端与后端的交互通道已打通。下一步，需要我为您设计 PostgreSQL 核心关系表结构（如租户配置、Schema 版本控制表）以及 Milvus 向量集合的 Schema 结构吗？"/>

```
