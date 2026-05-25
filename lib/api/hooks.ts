'use client';

import useSWR from 'swr';
import { ENDPOINTS, IS_LIVE, MOCK_LATENCY_MS } from './config';
import { swrFetcher } from './fetcher';
import { MOCK_MEMORIES } from '@/lib/mocks/memories';
import {
  MOCK_CATEGORY_PIE,
  MOCK_KPI_CARDS,
  MOCK_LATENCY,
  MOCK_NODE_HEALTH,
  MOCK_THROUGHPUT,
  MOCK_TTL_RECYCLE,
} from '@/lib/mocks/analytics';
import { MOCK_CAUSAL_EDGES, MOCK_CAUSAL_NODES, MOCK_PIPELINE } from '@/lib/mocks/graph';
import { MOCK_TRACE_HISTORY, MOCK_TRACE_SPANS } from '@/lib/mocks/traces';
import type { MemoryCategory, MemoryRecord } from '@/lib/types';

/** mock 模式的统一异步包装：模拟网络延迟，让 loading 态接近真实体验。 */
function mockDelayed<T>(value: T): Promise<T> {
  if (!MOCK_LATENCY_MS) return Promise.resolve(value);
  return new Promise((r) => setTimeout(() => r(value), MOCK_LATENCY_MS));
}

const swrConfig = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
  dedupingInterval: 5000,
};

/* ------------------------ 记忆金库 ------------------------ */
export interface VaultQuery {
  q?: string;
  category?: '全部' | MemoryCategory;
  agent?: string;
  page?: number;
  pageSize?: number;
}

export interface VaultResponse {
  items: MemoryRecord[];
  total: number;
}

function filterMemoriesLocal(list: MemoryRecord[], query: VaultQuery): MemoryRecord[] {
  const needle = (query.q ?? '').trim().toLowerCase();
  return list.filter((m) => {
    if (query.category && query.category !== '全部' && m.category !== query.category) return false;
    if (query.agent && query.agent !== '全部' && m.agentId !== query.agent) return false;
    if (!needle) return true;
    return (
      m.summary.toLowerCase().includes(needle) ||
      m.tags.some((t) => t.toLowerCase().includes(needle)) ||
      m.triggers.some((t) => t.toLowerCase().includes(needle)) ||
      m.sessionId.toLowerCase().includes(needle)
    );
  });
}

export function useVaultMemories(query: VaultQuery = {}) {
  const search = new URLSearchParams();
  if (query.q) search.set('q', query.q);
  if (query.category && query.category !== '全部') search.set('category', query.category);
  if (query.agent && query.agent !== '全部') search.set('agent_id', query.agent);
  if (query.page) search.set('page', String(query.page));
  if (query.pageSize) search.set('page_size', String(query.pageSize));
  const liveKey = `${ENDPOINTS.memory.vault}?${search.toString()}`;
  const mockKey = ['mock-vault', JSON.stringify(query)] as const;

  return useSWR<VaultResponse>(
    IS_LIVE ? liveKey : mockKey,
    IS_LIVE
      ? (k: string) => swrFetcher<VaultResponse>(k)
      : () => {
          const items = filterMemoriesLocal(MOCK_MEMORIES, query);
          return mockDelayed({ items, total: items.length });
        },
    swrConfig,
  );
}

/* ------------------------ 运行大盘 ------------------------ */
export function useAnalytics() {
  const liveKey = `${ENDPOINTS.analytics.kpi}::bundle`;
  return useSWR(
    IS_LIVE ? liveKey : 'mock-analytics',
    IS_LIVE
      ? async () => {
          // 真实模式下并发拉取多个端点
          const [kpi, throughput, latency, category, nodes, ttl] = await Promise.all([
            swrFetcher(ENDPOINTS.analytics.kpi),
            swrFetcher(ENDPOINTS.analytics.throughput),
            swrFetcher(ENDPOINTS.analytics.latency),
            swrFetcher(ENDPOINTS.analytics.category),
            swrFetcher(ENDPOINTS.analytics.nodes),
            swrFetcher(ENDPOINTS.analytics.ttl),
          ]);
          return { kpi, throughput, latency, category, nodes, ttl };
        }
      : () =>
          mockDelayed({
            kpi: MOCK_KPI_CARDS,
            throughput: MOCK_THROUGHPUT,
            latency: MOCK_LATENCY,
            category: MOCK_CATEGORY_PIE,
            nodes: MOCK_NODE_HEALTH,
            ttl: MOCK_TTL_RECYCLE,
          }),
    swrConfig,
  );
}

/* ------------------------ 认知拓扑 ------------------------ */
export function useGraphData() {
  return useSWR(
    IS_LIVE ? 'graph::bundle' : 'mock-graph',
    IS_LIVE
      ? async () => {
          const [pipeline, causal] = await Promise.all([
            swrFetcher(ENDPOINTS.graph.pipeline),
            swrFetcher(ENDPOINTS.graph.causal),
          ]);
          return { pipeline, causal };
        }
      : () =>
          mockDelayed({
            pipeline: MOCK_PIPELINE,
            causal: { nodes: MOCK_CAUSAL_NODES, edges: MOCK_CAUSAL_EDGES },
          }),
    swrConfig,
  );
}

/* ------------------------ 召回 X 光机 ------------------------ */
export function useTraceList() {
  return useSWR(
    IS_LIVE ? ENDPOINTS.trace.list : 'mock-trace-list',
    IS_LIVE
      ? (k: string) => swrFetcher(k)
      : () => mockDelayed(MOCK_TRACE_HISTORY),
    swrConfig,
  );
}

export function useTraceDetail(traceId: string | undefined) {
  return useSWR(
    traceId ? (IS_LIVE ? ENDPOINTS.trace.detail(traceId) : ['mock-trace', traceId]) : null,
    traceId && IS_LIVE
      ? (k: string) => swrFetcher(k)
      : () => mockDelayed(MOCK_TRACE_SPANS),
    swrConfig,
  );
}
