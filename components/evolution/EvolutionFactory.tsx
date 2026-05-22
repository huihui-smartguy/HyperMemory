'use client';

import { useMemo, useState } from 'react';
import { CognitionTree } from './CognitionTree';
import { DiffViewer } from './DiffViewer';
import { ReasoningStream } from './ReasoningStream';
import { Chip } from '@/components/ui/Chip';
import {
  DEFAULT_DRAFT_ID,
  MOCK_DRAFTS,
  MOCK_SCHEMA_TREE,
} from '@/lib/mocks/schemas';

type ApprovalStatus = 'AWAITING_APPROVAL' | 'ACCEPTED' | 'REFINED';

export function EvolutionFactory() {
  const [activeId, setActiveId] = useState<string>(DEFAULT_DRAFT_ID);
  // 每个节点独立维护审批状态，切换节点时不会串台。
  const [statusMap, setStatusMap] = useState<Record<string, ApprovalStatus>>({});

  const bundle = MOCK_DRAFTS[activeId];
  const currentStatus: ApprovalStatus = statusMap[activeId] ?? 'AWAITING_APPROVAL';

  // 每个 draft 的推理流是独立的；通过 key 强制 ReasoningStream 在切换时重新挂载。
  const streamKey = useMemo(() => `stream-${activeId}-${currentStatus}`, [activeId, currentStatus]);

  const handleAccept = () => setStatusMap((m) => ({ ...m, [activeId]: 'ACCEPTED' }));
  const handleRefine = () => setStatusMap((m) => ({ ...m, [activeId]: 'REFINED' }));
  const handleReset = () => setStatusMap((m) => ({ ...m, [activeId]: 'AWAITING_APPROVAL' }));

  return (
    <div className="mx-auto max-w-7xl px-6">
      {bundle ? (
        <ReasoningStream key={streamKey} chunks={bundle.chunks} />
      ) : (
        <div className="hm-glass rounded-2xl px-5 py-4 font-mono text-[12.5px] hm-subtle">
          <span className="hm-chip mr-2">STREAM_IDLE</span>
          该 Schema 当前无进化提案 · 推理流处于待机状态。
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* 左栏：认知树 */}
        <aside className="hm-card p-4 h-fit lg:sticky lg:top-20">
          <div className="px-2 pb-3 mb-2 border-b hm-hairline">
            <div className="text-[11.5px] uppercase tracking-[0.18em] hm-subtle">认知树</div>
            <div className="mt-1 text-[14px] font-semibold tracking-apple">Active Schemas</div>
          </div>
          <CognitionTree
            tree={MOCK_SCHEMA_TREE}
            activeId={activeId}
            onSelect={(id) => setActiveId(id)}
            draftIds={Object.keys(MOCK_DRAFTS)}
            statusMap={statusMap}
          />
          <p className="mt-3 px-2 text-[11.5px] hm-subtle leading-relaxed">
            带 <span className="text-accent">●</span> 标记的节点有进化提案；其余为稳态。
          </p>
        </aside>

        {/* 右栏：辩证视窗 */}
        <section className="space-y-4 min-w-0">
          {bundle ? (
            <>
              <div className="hm-card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-[11.5px] uppercase tracking-[0.18em] text-accent">
                      Schema Diff · Draft {bundle.draft.id}
                    </div>
                    <h3 className="mt-2 text-[20px] font-semibold tracking-apple">
                      {bundle.draft.title}
                    </h3>
                    <p className="mt-2 hm-subtle text-[13px]">
                      触发原因 · {bundle.draft.triggeredBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip variant="warn">惊喜度 {bundle.draft.surprise.toFixed(2)}</Chip>
                    <Chip
                      variant={
                        currentStatus === 'ACCEPTED'
                          ? 'success'
                          : currentStatus === 'REFINED'
                            ? 'warn'
                            : 'default'
                      }
                    >
                      {currentStatus === 'AWAITING_APPROVAL'
                        ? '待审批'
                        : currentStatus === 'ACCEPTED'
                          ? '已采纳'
                          : '驳回修正'}
                    </Chip>
                  </div>
                </div>
              </div>

              <DiffViewer
                key={`diff-${activeId}`}
                original={bundle.draft.oldMarkdown}
                modified={bundle.draft.newMarkdown}
              />

              <ApprovalDock
                status={currentStatus}
                draftId={bundle.draft.id}
                onAccept={handleAccept}
                onRefine={handleRefine}
                onReset={handleReset}
              />
            </>
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
    </div>
  );
}

/* ----------- 浮动审批坞 · 三态切换，视觉极明显 ----------- */
function ApprovalDock({
  status,
  draftId,
  onAccept,
  onRefine,
  onReset,
}: {
  status: ApprovalStatus;
  draftId: string;
  onAccept: () => void;
  onRefine: () => void;
  onReset: () => void;
}) {
  if (status === 'ACCEPTED') {
    return (
      <div className="rounded-2xl border border-signal-success/40 bg-signal-success/10 px-5 py-4 flex items-center justify-between gap-4 flex-wrap shadow-floating animate-rise">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-signal-success/20 text-signal-success flex items-center justify-center text-[16px]">
            ✓
          </span>
          <div>
            <div className="text-[14px] font-semibold tracking-apple text-signal-success">
              已采纳 · 通过 POST /api/v1/schema/accept 写入 Go 网关
            </div>
            <div className="mt-0.5 text-[12px] hm-subtle font-mono">draft · {draftId}</div>
          </div>
        </div>
        <button onClick={onReset} className="hm-btn-ghost">
          撤回审批
        </button>
      </div>
    );
  }

  if (status === 'REFINED') {
    return (
      <div className="rounded-2xl border border-signal-warning/40 bg-signal-warning/10 px-5 py-4 flex items-center justify-between gap-4 flex-wrap shadow-floating animate-rise">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-signal-warning/20 text-signal-warning flex items-center justify-center text-[16px]">
            ✎
          </span>
          <div>
            <div className="text-[14px] font-semibold tracking-apple text-signal-warning">
              已驳回 · Python 引擎将进入二次推理，请等待新的 Diff 推送
            </div>
            <div className="mt-0.5 text-[12px] hm-subtle font-mono">draft · {draftId}</div>
          </div>
        </div>
        <button onClick={onReset} className="hm-btn-ghost">
          撤回驳回
        </button>
      </div>
    );
  }

  return (
    <div className="hm-glass shadow-floating rounded-2xl px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="text-[13px] hm-subtle">
        完成审阅后即落盘生效。审批通过将通过 POST{' '}
        <code className="font-mono">/api/v1/schema/accept</code> 写入 Go 网关。
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="hm-btn-ghost" onClick={onRefine}>
          驳回并修正
        </button>
        <button type="button" className="hm-btn" onClick={onAccept}>
          采纳
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="hm-card p-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-black/[0.04] dark:bg-white/[0.06] grid place-items-center text-ink-tertiary">
        ◌
      </div>
      <h3 className="mt-4 text-[16px] font-semibold tracking-apple">该 Schema 当前处于稳态</h3>
      <p className="mt-2 hm-subtle text-[13px] leading-relaxed">
        滑动窗口提取器与惊喜度模块尚未对该节点形成进化提案。
        <br />
        请在左侧选择带 <span className="text-accent">●</span> 标记的演化节点查看 Diff。
      </p>
    </div>
  );
}
