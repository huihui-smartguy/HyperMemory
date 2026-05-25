import { NextRequest } from 'next/server';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return jsonResponse(
    {
      draftId: params.id,
      status: 'REFINED',
      nextDraftId: `${params.id}_v2`,
    },
    {
      source: 'mock',
      mockReason: 'schema-refine-is-product-concept-not-backend-feature',
      traceId: getTraceId(req),
    },
  );
}
