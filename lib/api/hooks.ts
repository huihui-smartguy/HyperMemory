'use client';

import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import {
  ENDPOINTS,
  MOCK_LATENCY_MS,
  USES_NETWORK,
  SSE_LIVE,
} from './config';
import { swrFetcher, swrFetcherWithMeta, fetcher, type ApiEnvelope, type DataSourceTag } from './fetcher';
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
import {
  DEFAULT_DRAFT_ID,
  MOCK_DRAFTS,
  MOCK_SCHEMA_TREE,
} from '@/lib/mocks/schemas';
import type { MemoryCategory, MemoryRecord, SchemaDraft, SchemaNode } from '@/lib/types';

function mockDelayed<T>(value: T): Promise<T> {
  if (!MOCK_LATENCY_MS) return Promise.resolve(value);
  return new Promise((r) => setTimeout(() => r(value), MOCK_LATENCY_MS));
}

const swrConfig = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
  dedupingInterval: 5000,
};

/** mock 模式下统一包装为 ApiEnvelope（source='mock'）。 */
function mockEnvelope<T>(data: T): ApiEnvelope<T> {
  return { data, source: 'mock' };
}

/* ------------------------ 记忆金库 ------------------------ */
export interface VaultQuery {
  q?: string;
  category?: '全部' | MemoryCategory;
  agent?: string;
  /** 精确按 user_id 过滤；非空时覆盖 tenant 派生的默认 user_id（BFF 行为）。 */
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface VaultResponse {
  items: MemoryRecord[];
  total: number;
  page?: number;
  page_size?: number;
}

function filterMemoriesLocal(list: MemoryRecord[], query: VaultQuery): MemoryRecord[] {
  const needle = (query.q ?? '').trim().toLowerCase();
  const userIdNeedle = (query.userId ?? '').trim().toLowerCase();
  return list.filter((m) => {
    if (query.category && query.category !== '全部' && m.category !== query.category) return false;
    if (query.agent && query.agent !== '全部' && m.agentId !== query.agent) return false;
    if (userIdNeedle && !m.userId.toLowerCase().includes(userIdNeedle)) return false;
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
  if (query.userId) search.set('user_id', query.userId);
  if (query.page) search.set('page', String(query.page));
  if (query.pageSize) search.set('page_size', String(query.pageSize));
  const netKey = `${ENDPOINTS.memory.vault}?${search.toString()}`;
  const mockKey = ['mock-vault', JSON.stringify(query)] as const;

  return useSWR<ApiEnvelope<VaultResponse>>(
    USES_NETWORK ? netKey : mockKey,
    USES_NETWORK
      ? (k: string) => swrFetcherWithMeta<VaultResponse>(k)
      : () => {
          const all = filterMemoriesLocal(MOCK_MEMORIES, query);
          const page = Math.max(query.page ?? 1, 1);
          const pageSize = Math.min(query.pageSize ?? 50, 200);
          const start = (page - 1) * pageSize;
          const items = all.slice(start, start + pageSize);
          return mockDelayed(
            mockEnvelope({ items, total: all.length, page, page_size: pageSize }),
          );
        },
    swrConfig,
  );
}

/* ------------------------ 运行大盘 ------------------------ */
export interface AnalyticsBundle {
  kpi: typeof MOCK_KPI_CARDS;
  throughput: typeof MOCK_THROUGHPUT;
  latency: typeof MOCK_LATENCY;
  category: typeof MOCK_CATEGORY_PIE;
  nodes: typeof MOCK_NODE_HEALTH;
  ttl: typeof MOCK_TTL_RECYCLE;
}

export function useAnalytics() {
  return useSWR<ApiEnvelope<AnalyticsBundle>>(
    USES_NETWORK ? ENDPOINTS.analytics.dashboard : 'mock-analytics',
    USES_NETWORK
      ? (k: string) => swrFetcherWithMeta<AnalyticsBundle>(k)
      : () =>
          mockDelayed(
            mockEnvelope<AnalyticsBundle>({
              kpi: MOCK_KPI_CARDS,
              throughput: MOCK_THROUGHPUT,
              latency: MOCK_LATENCY,
              category: MOCK_CATEGORY_PIE,
              nodes: MOCK_NODE_HEALTH,
              ttl: MOCK_TTL_RECYCLE,
            }),
          ),
    swrConfig,
  );
}

/* ------------------------ 认知拓扑 ------------------------ */
export interface GraphData {
  pipeline: typeof MOCK_PIPELINE;
  causal: { nodes: typeof MOCK_CAUSAL_NODES; edges: typeof MOCK_CAUSAL_EDGES };
}

export function useGraphData() {
  return useSWR<ApiEnvelope<GraphData>>(
    USES_NETWORK ? 'graph::bundle' : 'mock-graph',
    USES_NETWORK
      ? async () => {
          const [pipelineEnv, causalEnv] = await Promise.all([
            swrFetcherWithMeta<typeof MOCK_PIPELINE>(ENDPOINTS.graph.pipeline),
            swrFetcherWithMeta<{ nodes: typeof MOCK_CAUSAL_NODES; edges: typeof MOCK_CAUSAL_EDGES }>(
              ENDPOINTS.graph.causal,
            ),
          ]);
          const sources: DataSourceTag[] = [pipelineEnv.source, causalEnv.source];
          const source: DataSourceTag = sources.every((s) => s === 'real')
            ? 'real'
            : sources.every((s) => s === 'mock')
              ? 'mock'
              : 'hybrid';
          return {
            data: { pipeline: pipelineEnv.data, causal: causalEnv.data },
            source,
          } as ApiEnvelope<GraphData>;
        }
      : () =>
          mockDelayed(
            mockEnvelope<GraphData>({
              pipeline: MOCK_PIPELINE,
              causal: { nodes: MOCK_CAUSAL_NODES, edges: MOCK_CAUSAL_EDGES },
            }),
          ),
    swrConfig,
  );
}

/* ------------------------ 召回 X 光机 ------------------------ */
export function useTraceList() {
  return useSWR<ApiEnvelope<typeof MOCK_TRACE_HISTORY>>(
    USES_NETWORK ? ENDPOINTS.trace.list : 'mock-trace-list',
    USES_NETWORK
      ? (k: string) => swrFetcherWithMeta<typeof MOCK_TRACE_HISTORY>(k)
      : () => mockDelayed(mockEnvelope(MOCK_TRACE_HISTORY)),
    swrConfig,
  );
}

export function useTraceDetail(traceId: string | undefined) {
  return useSWR<ApiEnvelope<typeof MOCK_TRACE_SPANS>>(
    traceId ? (USES_NETWORK ? ENDPOINTS.trace.detail(traceId) : ['mock-trace', traceId]) : null,
    traceId && USES_NETWORK
      ? (k: string) => swrFetcherWithMeta<typeof MOCK_TRACE_SPANS>(k)
      : () => mockDelayed(mockEnvelope(MOCK_TRACE_SPANS)),
    swrConfig,
  );
}

/* ------------------------ Schema 进化车间 ------------------------ */

export interface DraftWithNode extends SchemaDraft {
  nodeId: string;
  chunks?: string[];
}

export function useSchemaTree() {
  return useSWR<ApiEnvelope<SchemaNode[]>>(
    USES_NETWORK ? ENDPOINTS.schema.tree : 'mock-schema-tree',
    USES_NETWORK
      ? (k: string) => swrFetcherWithMeta<SchemaNode[]>(k)
      : () => mockDelayed(mockEnvelope(MOCK_SCHEMA_TREE)),
    swrConfig,
  );
}

/** 单个 draft（按 nodeId 取）。 */
export function useSchemaDraft(nodeId: string | undefined) {
  return useSWR<ApiEnvelope<DraftWithNode>>(
    nodeId
      ? USES_NETWORK
        ? ENDPOINTS.schema.draft(nodeId)
        : ['mock-schema-draft', nodeId]
      : null,
    nodeId
      ? USES_NETWORK
        ? (k: string) => swrFetcherWithMeta<DraftWithNode>(k)
        : () => {
            const bundle = MOCK_DRAFTS[nodeId];
            if (!bundle) return mockDelayed({ data: null as unknown as DraftWithNode, source: 'mock' as const });
            return mockDelayed(
              mockEnvelope<DraftWithNode>({
                ...bundle.draft,
                nodeId,
                chunks: bundle.chunks,
              }),
            );
          }
      : null,
    swrConfig,
  );
}

/** 全部 drafts（带 nodeId） */
export function useSchemaDrafts() {
  return useSWR<ApiEnvelope<DraftWithNode[]>>(
    USES_NETWORK ? ENDPOINTS.schema.drafts : 'mock-schema-drafts',
    USES_NETWORK
      ? (k: string) => swrFetcherWithMeta<DraftWithNode[]>(k)
      : () =>
          mockDelayed(
            mockEnvelope(
              Object.entries(MOCK_DRAFTS).map(([nodeId, b]) => ({
                ...b.draft,
                nodeId,
                chunks: b.chunks,
              })),
            ),
          ),
    swrConfig,
  );
}

/** 采纳 / 驳回 — SWR Mutation。 */
export function useDraftAccept() {
  return useSWRMutation(
    'draft-accept',
    async (_key: string, { arg }: { arg: { id: string; comment?: string } }) => {
      if (!USES_NETWORK) return mockDelayed({ accepted: true });
      return fetcher(ENDPOINTS.schema.accept(arg.id), {
        method: 'POST',
        body: JSON.stringify({ comment: arg.comment }),
      });
    },
  );
}

export function useDraftRefine() {
  return useSWRMutation(
    'draft-refine',
    async (_key: string, { arg }: { arg: { id: string; comment?: string } }) => {
      if (!USES_NETWORK) return mockDelayed({ refined: true });
      return fetcher(ENDPOINTS.schema.refine(arg.id), {
        method: 'POST',
        body: JSON.stringify({ comment: arg.comment }),
      });
    },
  );
}

export const DEFAULT_DRAFT_NODE_ID = DEFAULT_DRAFT_ID;
export { SSE_LIVE };
