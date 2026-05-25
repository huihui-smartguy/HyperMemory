import { NextRequest } from 'next/server';
import { callNovamem } from '@/lib/api/_novamem-client';
import { MOCK } from '@/lib/api/_mock-source';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// HYBRID · 调 /health 探活；上游正常时把 mock 中首节点 state 改为 ok，否则 warn
export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);
  let upstreamOk = false;
  try {
    await callNovamem<unknown>('GET', '/health', undefined, { traceId });
    upstreamOk = true;
  } catch {
    upstreamOk = false;
  }
  const pipeline = MOCK.graph.pipeline.map((stage, i) =>
    i === 0 ? { ...stage, state: upstreamOk ? ('ok' as const) : ('warn' as const) } : stage,
  );
  return jsonResponse(pipeline, {
    source: 'hybrid',
    mockFields: ['pipeline[1..]'],
    mockReason: upstreamOk
      ? 'only-stage[0]-derived-from-real-health-probe'
      : 'upstream-down-stage[0]-set-to-warn',
    traceId,
  });
}
