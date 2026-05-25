import { NextRequest } from 'next/server';
import { callNovamem } from '@/lib/api/_novamem-client';
import { tenantToUserId } from '@/lib/api/_tenant-map';
import { getTraceId, jsonResponse } from '@/lib/api/_route-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface IngestBody {
  session_id?: string;
  agent_id?: string;
  messages: Array<{ role: string; content: string; turn_index?: number; timestamp?: string }>;
}

export async function POST(req: NextRequest) {
  const traceId = getTraceId(req);
  const body = (await req.json()) as IngestBody;
  const userId = tenantToUserId(req.headers.get('X-Tenant-Id'));

  await callNovamem<unknown>(
    'POST',
    '/v1/memories',
    {
      scope: { user_id: userId, session_id: body.session_id, agent_id: body.agent_id },
      messages: body.messages,
    },
    { traceId },
  );

  return jsonResponse({ accepted: true }, { source: 'real', traceId }, { status: 202 });
}
