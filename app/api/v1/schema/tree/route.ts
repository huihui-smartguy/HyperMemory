import { NextRequest } from 'next/server';
import { MOCK } from '@/lib/api/_mock-source';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return jsonResponse(MOCK.schema.tree, {
    source: 'mock',
    mockReason: 'schema-evolution-is-product-concept-not-backend-feature',
    traceId: getTraceId(req),
  });
}
