import { NextRequest } from 'next/server';
import { MOCK } from '@/lib/api/_mock-source';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return jsonResponse(MOCK.graph.causal, {
    source: 'mock',
    mockReason: 'backend-graph_db-module-reserved-not-implemented',
    traceId: getTraceId(req),
  });
}
