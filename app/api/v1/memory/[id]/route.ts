import { NextRequest } from 'next/server';
import { MOCK } from '@/lib/api/_mock-source';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 后端目前无 GET /v1/memories/{id}（P1 待补），短期 mock 兜底
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const traceId = getTraceId(req);
  const memory = MOCK.memories.find((m) => m.id === params.id);
  if (!memory) {
    return jsonResponse({ error: 'not_found' }, { source: 'mock', traceId }, { status: 404 });
  }
  return jsonResponse(memory, {
    source: 'mock',
    mockReason: 'backend-endpoint-not-implemented',
    traceId,
  });
}
