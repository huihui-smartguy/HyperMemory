import { NextRequest } from 'next/server';
import { callNovamem } from '@/lib/api/_novamem-client';
import { MOCK } from '@/lib/api/_mock-source';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// HYBRID: 调 /health 拼出一个真实"NovaMem · solo"节点，其他节点保持 mock
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);
  try {
    const h = await callNovamem<Record<string, unknown>>('GET', '/health', undefined, { traceId });
    const novamemNode = {
      node: 'NovaMem · solo',
      cpu: typeof h.cpu_pct === 'number' ? (h.cpu_pct as number) : 28,
      mem: typeof h.mem_pct === 'number' ? (h.mem_pct as number) : 52,
      status: h.status === 'ok' ? ('healthy' as const) : ('warn' as const),
    };
    return jsonResponse([novamemNode, ...MOCK.analytics.nodes], {
      source: 'hybrid',
      mockFields: MOCK.analytics.nodes.map((n) => n.node).join(',').split(','),
      mockReason: 'only-NovaMem-node-is-real',
      traceId,
    });
  } catch {
    return jsonResponse(MOCK.analytics.nodes, {
      source: 'mock',
      mockReason: 'upstream-health-unreachable',
      traceId,
    });
  }
}
