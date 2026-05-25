'use client';

import { useEffect, useState } from 'react';
import { DATA_MODE } from '@/lib/api/config';
import type { DataSourceTag } from '@/lib/api/fetcher';

interface Props {
  source?: DataSourceTag;
  mockFields?: string[];
  mockReason?: string;
}

const STYLE: Record<DataSourceTag, { dot: string; label: string; bg: string; text: string; ring: string }> = {
  real: {
    dot: 'bg-signal-success',
    label: 'REAL · NovaMem',
    bg: 'bg-signal-success/10',
    text: 'text-signal-success',
    ring: 'ring-signal-success/30',
  },
  hybrid: {
    dot: 'bg-signal-warning',
    label: 'REAL + MOCK',
    bg: 'bg-signal-warning/10',
    text: 'text-signal-warning',
    ring: 'ring-signal-warning/30',
  },
  mock: {
    dot: 'bg-ink-tertiary',
    label: 'MOCK',
    bg: 'bg-black/[0.04] dark:bg-white/[0.06]',
    text: 'text-ink-secondary',
    ring: 'ring-black/[0.06] dark:ring-white/[0.08]',
  },
};

const MODE_LABEL: Record<typeof DATA_MODE, string> = {
  mock: 'MOCK 模式',
  bff: 'BFF 模式',
  live: 'LIVE 模式',
};

/**
 * 数据源标识。
 * - 当 source 已知（hook 透出）：显示真实数据源
 * - 当 source 未知（页面层级展示）：根据全局 DATA_MODE 推断
 */
export function DataSourceBadge({ source, mockFields, mockReason }: Props) {
  // 防止 hydration 不一致 — DATA_MODE 在客户端读取 NEXT_PUBLIC_DATA_MODE。
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // 在 mock 模式下，source 无论如何都视为 mock
  const effective: DataSourceTag = DATA_MODE === 'mock' ? 'mock' : source ?? 'real';
  const s = STYLE[effective];

  const tooltipParts: string[] = [MODE_LABEL[DATA_MODE]];
  if (effective === 'hybrid' && mockFields?.length) {
    tooltipParts.push(`Mock 字段：${mockFields.join(', ')}`);
  }
  if (mockReason) tooltipParts.push(`原因：${mockReason}`);

  return (
    <span
      title={tooltipParts.join(' · ')}
      className={`inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[11.5px] font-medium ring-1 ${s.bg} ${s.text} ${s.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${effective === 'real' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
}
