// Route Handler 唯一 mock 数据入口。
// `import 'server-only'` 强制此模块仅在 server runtime 可见 —
// 客户端组件若误引此文件，Next.js build 将直接报错。
import 'server-only';

import { MOCK_MEMORIES } from '@/lib/mocks/memories';
import {
  MOCK_CATEGORY_PIE,
  MOCK_KPI_CARDS,
  MOCK_LATENCY,
  MOCK_NODE_HEALTH,
  MOCK_THROUGHPUT,
  MOCK_TTL_RECYCLE,
} from '@/lib/mocks/analytics';
import {
  DEFAULT_DRAFT_ID,
  MOCK_DRAFTS,
  MOCK_SCHEMA_TREE,
} from '@/lib/mocks/schemas';
import {
  MOCK_CAUSAL_EDGES,
  MOCK_CAUSAL_NODES,
  MOCK_PIPELINE,
} from '@/lib/mocks/graph';
import { MOCK_TRACE_HISTORY, MOCK_TRACE_SPANS } from '@/lib/mocks/traces';

export const MOCK = {
  memories: MOCK_MEMORIES,
  analytics: {
    kpi: MOCK_KPI_CARDS,
    throughput: MOCK_THROUGHPUT,
    latency: MOCK_LATENCY,
    category: MOCK_CATEGORY_PIE,
    nodes: MOCK_NODE_HEALTH,
    ttl: MOCK_TTL_RECYCLE,
  },
  schema: {
    tree: MOCK_SCHEMA_TREE,
    drafts: MOCK_DRAFTS,
    defaultDraftId: DEFAULT_DRAFT_ID,
  },
  graph: {
    pipeline: MOCK_PIPELINE,
    causal: { nodes: MOCK_CAUSAL_NODES, edges: MOCK_CAUSAL_EDGES },
  },
  traces: {
    list: MOCK_TRACE_HISTORY,
    spans: MOCK_TRACE_SPANS,
  },
} as const;
