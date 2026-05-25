import { NextRequest } from 'next/server';
import { callNovamem } from '@/lib/api/_novamem-client';
import { MOCK } from '@/lib/api/_mock-source';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 聚合端点 · 并发拉 6 个子指标
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);

  const novamemNode = await callNovamem<Record<string, unknown>>('GET', '/health', undefined, { traceId })
    .then((h) => ({
      node: 'NovaMem · solo',
      cpu: typeof h.cpu_pct === 'number' ? (h.cpu_pct as number) : 28,
      mem: typeof h.mem_pct === 'number' ? (h.mem_pct as number) : 52,
      status: h.status === 'ok' ? ('healthy' as const) : ('warn' as const),
    }))
    .catch(() => null);

  const nodes = novamemNode ? [novamemNode, ...MOCK.analytics.nodes] : MOCK.analytics.nodes;

  return jsonResponse(
    {
      kpi: MOCK.analytics.kpi,
      throughput: MOCK.analytics.throughput,
      latency: MOCK.analytics.latency,
      category: MOCK.analytics.category,
      nodes,
      ttl: MOCK.analytics.ttl,
    },
    {
      source: 'hybrid',
      mockFields: ['kpi', 'throughput', 'latency', 'category', 'ttl'],
      mockReason: novamemNode
        ? 'only-nodes[0]-derived-from-real-health'
        : 'upstream-health-unreachable',
      traceId,
    },
  );
}
