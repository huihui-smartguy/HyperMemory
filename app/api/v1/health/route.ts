import { NextRequest } from 'next/server';
import { callNovamem } from '@/lib/api/_novamem-client';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);
  try {
    const data = await callNovamem<Record<string, unknown>>('GET', '/health', undefined, { traceId });
    return jsonResponse({ ...data, bff: 'ok' }, { source: 'real', traceId });
  } catch (e) {
    return jsonResponse(
      { status: 'degraded', bff: 'ok', upstream: 'unreachable', message: (e as Error).message },
      { source: 'hybrid', mockReason: 'upstream-down', traceId },
      { status: 200 },
    );
  }
}
