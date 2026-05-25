import { NextRequest } from 'next/server';
import { MOCK } from '@/lib/api/_mock-source';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 把 MOCK_DRAFTS Record 拍平为 draft 数组
  const drafts = Object.entries(MOCK.schema.drafts).map(([nodeId, bundle]) => ({
    ...bundle.draft,
    nodeId,
  }));
  return jsonResponse(drafts, {
    source: 'mock',
    mockReason: 'schema-evolution-is-product-concept-not-backend-feature',
    traceId: getTraceId(req),
  });
}
