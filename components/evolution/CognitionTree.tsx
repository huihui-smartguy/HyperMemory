'use client';

import { useState } from 'react';
import type { SchemaNode } from '@/lib/types';
import { Chip } from '@/components/ui/Chip';

type ApprovalStatus = 'AWAITING_APPROVAL' | 'ACCEPTED' | 'REFINED';

interface Props {
  tree: SchemaNode[];
  activeId?: string;
  onSelect?: (id: string) => void;
  /** 拥有进化提案的节点 id 列表 */
  draftIds?: string[];
  /** 每个节点对应的审批状态 */
  statusMap?: Record<string, ApprovalStatus>;
}

export function CognitionTree({ tree, activeId, onSelect, draftIds = [], statusMap = {} }: Props) {
  const draftSet = new Set(draftIds);
  return (
    <ul className="space-y-1 text-[13.5px]">
      {tree.map((n) => (
        <TreeItem
          key={n.id}
          node={n}
          depth={0}
          activeId={activeId}
          onSelect={onSelect}
          draftSet={draftSet}
          statusMap={statusMap}
        />
      ))}
    </ul>
  );
}

function TreeItem({
  node,
  depth,
  activeId,
  onSelect,
  draftSet,
  statusMap,
}: {
  node: SchemaNode;
  depth: number;
  activeId?: string;
  onSelect?: (id: string) => void;
  draftSet: Set<string>;
  statusMap: Record<string, ApprovalStatus>;
}) {
  const [open, setOpen] = useState(true);
  const hasChild = !!node.children?.length;
  const isActive = activeId === node.id;
  const hasDraft = draftSet.has(node.id);
  const approval = statusMap[node.id];

  return (
    <li>
      <div
        className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? 'bg-accent-mute'
            : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => {
          if (hasChild) setOpen(!open);
          onSelect?.(node.id);
        }}
      >
        <span
          className={`w-3 inline-block text-[10px] hm-subtle transition-transform ${
            hasChild ? (open ? 'rotate-90' : '') : 'opacity-0'
          }`}
        >
          ▸
        </span>

        {/* 带 draft 的节点显示蓝点标记 */}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            hasDraft ? 'bg-accent' : 'bg-transparent'
          }`}
        />

        <span className={`flex-1 truncate ${isActive ? 'text-accent font-medium' : ''}`}>
          {node.name}
        </span>

        <span className="hm-subtle text-[11px] font-mono tabular-nums">{node.version}</span>

        {approval === 'ACCEPTED' ? (
          <Chip variant="success">已采纳</Chip>
        ) : approval === 'REFINED' ? (
          <Chip variant="warn">驳回</Chip>
        ) : (
          <Chip
            variant={
              node.status === 'stable'
                ? 'success'
                : node.status === 'evolving'
                  ? 'warn'
                  : 'accent'
            }
          >
            {node.status === 'stable' ? '稳定' : node.status === 'evolving' ? '演化中' : '草案'}
          </Chip>
        )}
      </div>
      {hasChild && open && (
        <ul className="space-y-1 mt-1">
          {node.children!.map((c) => (
            <TreeItem
              key={c.id}
              node={c}
              depth={depth + 1}
              activeId={activeId}
              onSelect={onSelect}
              draftSet={draftSet}
              statusMap={statusMap}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
