'use client';

import { useState } from 'react';
import type { SchemaNode } from '@/lib/types';
import { Chip } from '@/components/ui/Chip';

interface Props {
  tree: SchemaNode[];
  activeId?: string;
  onSelect?: (id: string) => void;
}

export function CognitionTree({ tree, activeId, onSelect }: Props) {
  return (
    <ul className="space-y-1 text-[13.5px]">
      {tree.map((n) => (
        <TreeItem key={n.id} node={n} depth={0} activeId={activeId} onSelect={onSelect} />
      ))}
    </ul>
  );
}

function TreeItem({
  node,
  depth,
  activeId,
  onSelect,
}: {
  node: SchemaNode;
  depth: number;
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChild = !!node.children?.length;
  const isActive = activeId === node.id;

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
        <span className={`flex-1 truncate ${isActive ? 'text-accent font-medium' : ''}`}>
          {node.name}
        </span>
        <span className="hm-subtle text-[11px] font-mono tabular-nums">{node.version}</span>
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
      </div>
      {hasChild && open && (
        <ul className="space-y-1 mt-1">
          {node.children!.map((c) => (
            <TreeItem key={c.id} node={c} depth={depth + 1} activeId={activeId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}
