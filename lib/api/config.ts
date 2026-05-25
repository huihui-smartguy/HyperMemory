// HyperMemory 前端数据层配置 · 单一可信源
// NEXT_PUBLIC_* 前缀的变量会注入到客户端 bundle；
// 无 NEXT_PUBLIC_ 前缀的（如 NOVAMEM_BASE_URL）仅在 server runtime 可见，防内网地址泄漏。

export type DataMode = 'mock' | 'bff' | 'live';

export const DATA_MODE: DataMode = (() => {
  const v = process.env.NEXT_PUBLIC_DATA_MODE;
  if (v === 'live' || v === 'bff' || v === 'mock') return v;
  return 'mock';
})();

export const IS_MOCK = DATA_MODE === 'mock';
export const IS_BFF = DATA_MODE === 'bff';
export const IS_LIVE = DATA_MODE === 'live';

/** bff / live 模式都走网络栈；mock 直接读静态数据。 */
export const USES_NETWORK = IS_BFF || IS_LIVE;

/**
 * 客户端发请求时的 base URL：
 * - bff 模式：空串 → fetch('/api/v1/...') 同源，由 Next.js Route Handler 接收
 * - live 模式：远端独立网关
 * - mock 模式：不发请求
 */
export const API_BASE_URL = IS_LIVE
  ? process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8080'
  : '';

/** 默认租户。客户端可见。 */
export const DEFAULT_TENANT = process.env.NEXT_PUBLIC_TENANT || '理财部 · Wealth-01';

/** SSE 真实模式开关；false 时 BFF 内吐打字机假流。 */
export const SSE_LIVE = USES_NETWORK && process.env.NEXT_PUBLIC_SSE_LIVE !== 'false';

/** mock 模式人为延迟。 */
export const MOCK_LATENCY_MS = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? '180');

/* ---- server-only 变量 · 仅 Route Handler 可见 ---- */

/** NovaMem 后端 base URL。仅服务端可见，避免内网地址泄漏到 client bundle。 */
export const NOVAMEM_BASE_URL =
  process.env.NOVAMEM_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8001';

/** BFF 短路开关：=1 时不发真实 HTTP，由 _novamem-client.ts 内吐预置 fixture。 */
export const BFF_USE_MOCK_BACKEND = process.env.BFF_USE_MOCK_BACKEND === '1';

export const ENDPOINTS = {
  memory: {
    vault: '/api/v1/memory/vault',
    detail: (id: string) => `/api/v1/memory/${id}`,
    ingest: '/api/v1/memory/ingest',
  },
  analytics: {
    dashboard: '/api/v1/analytics/dashboard',
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
  health: '/api/v1/health',
} as const;
