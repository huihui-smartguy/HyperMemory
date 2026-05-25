import { NextRequest } from 'next/server';
import { callNovamem } from '@/lib/api/_novamem-client';
import {
  recallToMemoryRecord,
  type NMRecallResponse,
} from '@/lib/api/adapters/novamem';
import { MOCK } from '@/lib/api/_mock-source';
import { tenantToUserId, userIdToTenant } from '@/lib/api/_tenant-map';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';
import type { MemoryCategory, MemoryRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UNIVERSAL_QUERY = '*';

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);
  const sp = req.nextUrl.searchParams;
  const q = sp.get('q')?.trim() || '';
  const category = sp.get('category') as MemoryCategory | '全部' | null;
  const agentId = sp.get('agent_id');
  const page = Math.max(Number(sp.get('page') ?? 1), 1);
  const pageSize = Math.min(Number(sp.get('page_size') ?? 50), 200);

  const tenantHeader = req.headers.get('X-Tenant-Id');
  const userId = tenantToUserId(tenantHeader);
  const tenantDisplay = userIdToTenant(userId);

  // 用户决策：空 query 时也用万能 query 调后端
  const effectiveQuery = q || UNIVERSAL_QUERY;

  try {
    const upstream = await callNovamem<NMRecallResponse>(
      'POST',
      '/v1/recall',
      {
        scope: { user_id: userId, agent_id: agentId ?? undefined },
        query: effectiveQuery,
        options: { top_k: pageSize },
      },
      { traceId },
    );

    let items: MemoryRecord[] = (upstream.results ?? []).map((r) =>
      recallToMemoryRecord(r, tenantDisplay),
    );

    if (category && category !== '全部') {
      items = items.filter((m) => m.category === category);
    }

    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    // category / triggers / tags 是 BFF/后端混合产生的（后端 P2 才有 semantic_category），标 hybrid
    return jsonResponse(
      { items: paged, total: items.length, page, page_size: pageSize },
      {
        source: 'hybrid',
        mockFields: ['category', 'tenant'],
        mockReason: q ? undefined : 'empty-query-uses-universal-recall',
        traceId,
      },
    );
  } catch (e) {
    // 上游不可达：mock 兜底
    const filtered = filterLocalMock({ q, category, agentId });
    const start = (page - 1) * pageSize;
    return jsonResponse(
      { items: filtered.slice(start, start + pageSize), total: filtered.length, page, page_size: pageSize },
      {
        source: 'mock',
        mockReason: `upstream-unreachable: ${(e as Error).message}`,
        traceId,
      },
    );
  }
}

function filterLocalMock(opts: {
  q: string;
  category: MemoryCategory | '全部' | null;
  agentId: string | null;
}) {
  const needle = opts.q.toLowerCase();
  return MOCK.memories.filter((m) => {
    if (opts.category && opts.category !== '全部' && m.category !== opts.category) return false;
    if (opts.agentId && opts.agentId !== '全部' && m.agentId !== opts.agentId) return false;
    if (!needle) return true;
    return (
      m.summary.toLowerCase().includes(needle) ||
      m.tags.some((t) => t.toLowerCase().includes(needle)) ||
      m.triggers.some((t) => t.toLowerCase().includes(needle)) ||
      m.sessionId.toLowerCase().includes(needle)
    );
  });
}
