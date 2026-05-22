'use client';

import { useState } from 'react';
import { CognitionTree } from './CognitionTree';
import { DiffViewer } from './DiffViewer';
import { ReasoningStream } from './ReasoningStream';
import { Chip } from '@/components/ui/Chip';
import { MOCK_REASONING_CHUNKS, MOCK_SCHEMA_DRAFT, MOCK_SCHEMA_TREE } from '@/lib/mocks/schemas';

export function EvolutionFactory() {
  const [activeId, setActiveId] = useState('skill-recommend');
  const [status, setStatus] = useState<'AWAITING_APPROVAL' | 'ACCEPTED' | 'REFINED'>(
    MOCK_SCHEMA_DRAFT.status,
  );
  const draft = MOCK_SCHEMA_DRAFT;

  return (
    <div className="mx-auto max-w-7xl px-6">
      <ReasoningStream chunks={MOCK_REASONING_CHUNKS} />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* 左栏：认知树 */}
        <aside className="hm-card p-4 h-fit sticky top-20">
          <div className="px-2 pb-3 mb-2 border-b hm-hairline">
            <div className="text-[11.5px] uppercase tracking-[0.18em] hm-subtle">认知树</div>
            <div className="mt-1 text-[14px] font-semibold tracking-apple">Active Schemas</div>
          </div>
          <CognitionTree tree={MOCK_SCHEMA_TREE} activeId={activeId} onSelect={setActiveId} />
        </aside>

        {/* 右栏：辩证视窗 */}
        <section className="space-y-4">
          <div className="hm-card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="text-[11.5px] uppercase tracking-[0.18em] text-accent">
                  Schema Diff · Draft {draft.id}
                </div>
                <h3 className="mt-2 text-[20px] font-semibold tracking-apple">{draft.title}</h3>
                <p className="mt-2 hm-subtle text-[13px]">触发原因 · {draft.triggeredBy}</p>
              </div>
              <div className="flex items-center gap-2">
                <Chip variant="warn">惊喜度 {draft.surprise.toFixed(2)}</Chip>
                <Chip
                  variant={
                    status === 'ACCEPTED'
                      ? 'success'
                      : status === 'REFINED'
                        ? 'accent'
                        : 'default'
                  }
                >
                  {status === 'AWAITING_APPROVAL'
                    ? '待审批'
                    : status === 'ACCEPTED'
                      ? '已采纳'
                      : '驳回修正'}
                </Chip>
              </div>
            </div>
          </div>

          <DiffViewer original={draft.oldMarkdown} modified={draft.newMarkdown} />

          {/* 浮动审批卡 */}
          <div className="sticky bottom-6">
            <div className="hm-glass shadow-floating rounded-2xl px-5 py-3 flex items-center justify-between">
              <div className="text-[13px] hm-subtle">
                完成审阅后即落盘生效。审批通过将通过 POST <code className="font-mono">/api/v1/schema/accept</code> 写入 Go 网关。
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="hm-btn-ghost"
                  onClick={() => setStatus('REFINED')}
                  disabled={status !== 'AWAITING_APPROVAL'}
                >
                  驳回并修正
                </button>
                <button
                  className="hm-btn"
                  onClick={() => setStatus('ACCEPTED')}
                  disabled={status !== 'AWAITING_APPROVAL'}
                >
                  采纳
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
