// HyperMemory 前端数据层配置 · 单一可信源
// 全部读取 NEXT_PUBLIC_* 环境变量，便于在 build 时被 Next.js 注入到客户端 bundle。

export type DataMode = 'mock' | 'live';

export const DATA_MODE: DataMode =
  process.env.NEXT_PUBLIC_DATA_MODE === 'live' ? 'live' : 'mock';

export const IS_LIVE = DATA_MODE === 'live';
export const IS_MOCK = DATA_MODE === 'mock';

/** Go 网关地址。live 模式下所有 REST/SSE 都走此 base。 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8080';

/** 默认租户 ID，附加在 Header X-Tenant-Id。 */
export const DEFAULT_TENANT = process.env.NEXT_PUBLIC_TENANT || 'wealth-01';

/** SSE 模式：true 走真实 EventSource，false 走本地模拟流。 */
export const SSE_LIVE = IS_LIVE && process.env.NEXT_PUBLIC_SSE_LIVE !== 'false';

/** 模拟网络延迟（ms），仅 mock 模式下生效，让加载态更真实。 */
export const MOCK_LATENCY_MS = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? '180');

export const ENDPOINTS = {
  memory: {
    vault: '/api/v1/memory/vault',
    detail: (id: string) => `/api/v1/memory/${id}`,
  },
  analytics: {
    throughput: '/api/v1/analytics/throughput',
    latency: '/api/v1/analytics/latency',
    category: '/api/v1/analytics/category',
    nodes: '/api/v1/analytics/nodes',
    ttl: '/api/v1/analytics/ttl',
    kpi: '/api/v1/analytics/kpi',
  },
  schema: {
    tree: '/api/v1/schema/tree',
    drafts: '/api/v1/schema/drafts',
    draft: (id: string) => `/api/v1/schema/drafts/${id}`,
    accept: (id: string) => `/api/v1/schema/drafts/${id}/accept`,
    refine: (id: string) => `/api/v1/schema/drafts/${id}/refine`,
    stream: '/api/v1/evolution/stream',
  },
  graph: {
    pipeline: '/api/v1/graph/pipeline',
    causal: '/api/v1/graph/causal',
  },
  trace: {
    list: '/api/v1/traces',
    detail: (id: string) => `/api/v1/traces/${id}`,
  },
} as const;
