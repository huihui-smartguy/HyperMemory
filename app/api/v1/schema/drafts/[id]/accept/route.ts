import { NextRequest } from 'next/server';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return jsonResponse(
    {
      draftId: params.id,
      status: 'ACCEPTED',
      version: `v${Math.floor(Math.random() * 10) + 3}.${Math.floor(Math.random() * 10)}.0`,
      appliedAt: new Date().toISOString(),
    },
    {
      source: 'mock',
      mockReason: 'schema-accept-is-product-concept-not-backend-feature',
      traceId: getTraceId(req),
    },
  );
}
