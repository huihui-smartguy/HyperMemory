import { NextRequest } from 'next/server';
import { callNovamem } from '@/lib/api/_novamem-client';
import { MOCK } from '@/lib/api/_mock-source';
import {
  recallLogToTraceSummary,
  type NMRecallLog,
} from '@/lib/api/adapters/novamem';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface RecallLogsResponse {
  items: NMRecallLog[];
}

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);
  const sp = req.nextUrl.searchParams;
  const limit = Math.min(Number(sp.get('limit') ?? 50), 200);
  const agentId = sp.get('agent_id');
  const search = new URLSearchParams();
  search.set('limit', String(limit));
  if (agentId) search.set('agent_id', agentId);
  if (sp.get('from')) search.set('from', sp.get('from')!);
  if (sp.get('to')) search.set('to', sp.get('to')!);

  try {
    const upstream = await callNovamem<RecallLogsResponse>(
      'GET',
      `/v1/admin/recall-logs?${search.toString()}`,
      undefined,
      { traceId },
    );
    const items = (upstream.items ?? []).map(recallLogToTraceSummary);
    return jsonResponse(items, { source: 'real', traceId });
  } catch (e) {
    // 后端可能尚未实现 /v1/admin/recall-logs (P0 待补) — mock 兜底
    return jsonResponse(MOCK.traces.list, {
      source: 'mock',
      mockReason: 'backend-recall-logs-endpoint-not-ready',
      traceId,
    });
  }
}
