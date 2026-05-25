import { NextRequest } from 'next/server';
import { callNovamem } from '@/lib/api/_novamem-client';
import { MOCK } from '@/lib/api/_mock-source';
import { recallLogToSpans, type NMRecallLog } from '@/lib/api/adapters/novamem';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { traceId: string } },
) {
  const traceId = getTraceId(req);

  try {
    const upstream = await callNovamem<NMRecallLog>(
      'GET',
      `/v1/admin/recall-logs/${encodeURIComponent(params.traceId)}`,
      undefined,
      { traceId },
    );
    const spans = recallLogToSpans(upstream);
    return jsonResponse(spans, {
      source: 'hybrid',
      mockReason: 'span-breakdown-synthesized-from-total-duration',
      mockFields: ['module', 'operation', 'start'],
      traceId,
    });
  } catch {
    return jsonResponse(MOCK.traces.spans, {
      source: 'mock',
      mockReason: 'backend-recall-log-detail-not-ready',
      traceId,
    });
  }
}
