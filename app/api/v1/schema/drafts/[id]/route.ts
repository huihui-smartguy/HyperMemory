import { NextRequest } from 'next/server';
import { MOCK } from '@/lib/api/_mock-source';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const traceId = getTraceId(req);
  // id 既可能是 nodeId（如 'skill-recommend'），也可能是 draft 的 id（如 'draft_2026-05-22_01'）
  const byNode = MOCK.schema.drafts[params.id];
  if (byNode) {
    return jsonResponse({ ...byNode.draft, nodeId: params.id }, {
      source: 'mock',
      mockReason: 'schema-evolution-is-product-concept-not-backend-feature',
      traceId,
    });
  }
  const byDraftId = Object.entries(MOCK.schema.drafts).find(([, b]) => b.draft.id === params.id);
  if (byDraftId) {
    const [nodeId, bundle] = byDraftId;
    return jsonResponse({ ...bundle.draft, nodeId }, {
      source: 'mock',
      mockReason: 'schema-evolution-is-product-concept-not-backend-feature',
      traceId,
    });
  }
  return jsonResponse({ error: 'not_found' }, { source: 'mock', traceId }, { status: 404 });
}
