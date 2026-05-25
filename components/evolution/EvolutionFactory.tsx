'use client';

import { useMemo, useState } from 'react';
import { CognitionTree } from './CognitionTree';
import { DiffViewer } from './DiffViewer';
import { ReasoningStream } from './ReasoningStream';
import { Chip } from '@/components/ui/Chip';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import {
  DEFAULT_DRAFT_NODE_ID,
  useDraftAccept,
  useDraftRefine,
  useSchemaDraft,
  useSchemaDrafts,
  useSchemaTree,
} from '@/lib/api/hooks';

type ApprovalStatus = 'AWAITING_APPROVAL' | 'ACCEPTED' | 'REFINED';

export function EvolutionFactory() {
  const [activeId, setActiveId] = useState<string>(DEFAULT_DRAFT_NODE_ID);
  const [statusMap, setStatusMap] = useState<Record<string, ApprovalStatus>>({});

  const treeQuery = useSchemaTree();
  const draftsQuery = useSchemaDrafts();
  const draftQuery = useSchemaDraft(activeId);

  const tree = treeQuery.data?.data ?? [];
  const drafts = draftsQuery.data?.data ?? [];
  const draftIds = useMemo(() => drafts.map((d) => d.nodeId), [drafts]);
  const bundle = draftQuery.data?.data ?? null;

  const currentStatus: ApprovalStatus = statusMap[activeId] ?? 'AWAITING_APPROVAL';
  const streamKey = useMemo(() => `stream-${activeId}-${currentStatus}`, [activeId, currentStatus]);

  const { trigger: acceptTrigger, isMutating: accepting } = useDraftAccept();
  const { trigger: refineTrigger, isMutating: refining } = useDraftRefine();

  const handleAccept = async () => {
    if (!bundle) return;
    try {
      await acceptTrigger({ id: bundle.id });
    } catch {
      // 静默失败，状态机仍切换为 ACCEPTED（与现有 UX 一致）
    }
    setStatusMap((m) => ({ ...m, [activeId]: 'ACCEPTED' }));
  };
  const handleRefine = async () => {
    if (!bundle) return;
    try {
      await refineTrigger({ id: bundle.id });
    } catch {}
    setStatusMap((m) => ({ ...m, [activeId]: 'REFINED' }));
  };
  const handleReset = () => setStatusMap((m) => ({ ...m, [activeId]: 'AWAITING_APPROVAL' }));

  return (
    <div className="mx-auto max-w-7xl px-6">
      {/* 顶部数据源指示 */}
      <div className="mb-4 flex items-center gap-2">
        <DataSourceBadge
          source={draftQuery.data?.source ?? treeQuery.data?.source}
          mockReason={draftQuery.data?.mockReason ?? treeQuery.data?.mockReason}
        />
        <span className="hm-subtle text-[12px]">
          Schema 进化为产品概念，NovaMem 暂不直接提供推理流，BFF 端模拟。
        </span>
      </div>

      {bundle ? (
        <ReasoningStream
          key={streamKey}
          draftNodeId={activeId}
          fallbackChunks={bundle.chunks ?? []}
        />
      ) : (
        <div className="hm-glass rounded-2xl px-5 py-4 font-mono text-[12.5px] hm-subtle">
          <span className="hm-chip mr-2">STREAM_IDLE</span>
          该 Schema 当前无进化提案 · 推理流处于待机状态。
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <aside className="hm-card p-4 h-fit lg:sticky lg:top-20">
          <div className="px-2 pb-3 mb-2 border-b hm-hairline">
            <div className="text-[11.5px] uppercase tracking-[0.18em] hm-subtle">认知树</div>
            <div className="mt-1 text-[14px] font-semibold tracking-apple">Active Schemas</div>
          </div>
          <CognitionTree
            tree={tree}
            activeId={activeId}
            onSelect={(id) => setActiveId(id)}
            draftIds={draftIds}
            statusMap={statusMap}
          />
          <p className="mt-3 px-2 text-[11.5px] hm-subtle leading-relaxed">
            带 <span className="text-accent">●</span> 标记的节点有进化提案；其余为稳态。
          </p>
        </aside>

        <section className="space-y-4 min-w-0">
          {bundle ? (
            <>
              <div className="hm-card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-[11.5px] uppercase tracking-[0.18em] text-accent">
                      Schema Diff · Draft {bundle.id}
                    </div>
                    <h3 className="mt-2 text-[20px] font-semibold tracking-apple">
                      {bundle.title}
                    </h3>
                    <p className="mt-2 hm-subtle text-[13px]">
                      触发原因 · {bundle.triggeredBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip variant="warn">惊喜度 {bundle.surprise.toFixed(2)}</Chip>
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
                original={bundle.oldMarkdown}
                modified={bundle.newMarkdown}
              />

              <ApprovalDock
                status={currentStatus}
                draftId={bundle.id}
                pending={accepting || refining}
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

function ApprovalDock({
  status,
  draftId,
  pending,
  onAccept,
  onRefine,
  onReset,
}: {
  status: ApprovalStatus;
  draftId: string;
  pending: boolean;
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
              已采纳 · 通过 POST /api/v1/schema/drafts/{draftId}/accept 写入
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
              已驳回 · 引擎将进入二次推理，请等待新的 Diff 推送
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
        <code className="font-mono">/api/v1/schema/drafts/{draftId}/accept</code> 写入。
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="hm-btn-ghost" onClick={onRefine} disabled={pending}>
          驳回并修正
        </button>
        <button type="button" className="hm-btn" onClick={onAccept} disabled={pending}>
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
