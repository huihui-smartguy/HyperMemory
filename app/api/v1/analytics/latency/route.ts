import { NextRequest } from 'next/server';
import { MOCK } from '@/lib/api/_mock-source';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return jsonResponse(MOCK.analytics.latency, {
    source: 'mock',
    mockReason: 'backend-latency-endpoint-not-ready',
    traceId: getTraceId(req),
  });
}
