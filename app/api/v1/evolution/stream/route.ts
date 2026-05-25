import { NextRequest } from 'next/server';
import { MOCK } from '@/lib/api/_mock-source';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// SSE 端点 · 后端目前无 evolution 推理流，BFF 自己生成模拟流。
// 前端通过 EventSource 连接，事件名严格遵循 INTEGRATION.md 第 5.2 节定义。
export async function GET(req: NextRequest) {
  const bundle = MOCK.schema.drafts[MOCK.schema.defaultDraftId];
  const draftId = bundle.draft.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller 已关闭
        }
      };

      const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

      // 1. surprise_alert
      emit('surprise_alert', {
        draftId,
        surprise: bundle.draft.surprise,
        triggeredBy: bundle.draft.triggeredBy,
      });

      // 2. reasoning_chunk 流（按 mock 推理 chunks 拆出）
      let seq = 0;
      for (const chunk of bundle.chunks) {
        // 按字符拆，模拟打字机
        for (const ch of chunk) {
          emit('reasoning_chunk', { draftId, chunk: ch, seq: seq++ });
          await sleep(22);
        }
        await sleep(450);
      }

      // 3. schema_diff
      emit('schema_diff', {
        draftId,
        old_schema: bundle.draft.oldMarkdown,
        new_schema: bundle.draft.newMarkdown,
        status: 'AWAITING_APPROVAL',
      });

      // 4. ping 心跳 30s 一次
      const pingTimer = setInterval(() => emit('ping', { ts: Date.now() }), 30_000);
      req.signal.addEventListener('abort', () => {
        clearInterval(pingTimer);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Data-Source': 'mock',
      'X-Mock-Data': 'true',
      'X-Mock-Reason': 'schema-evolution-is-product-concept-not-backend-feature',
    },
  });
}
