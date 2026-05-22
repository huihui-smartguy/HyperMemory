'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MOCK_MEMORIES } from '@/lib/mocks/memories';
import { Chip } from '@/components/ui/Chip';
import type { MemoryCategory, MemoryRecord } from '@/lib/types';

const CATEGORIES: ('全部' | MemoryCategory)[] = [
  '全部',
  '事实记忆',
  '语义记忆',
  '画像规则',
  '情景记忆',
];

const variantForCategory = (c: MemoryCategory) =>
  c === '画像规则' ? 'accent' : c === '语义记忆' ? 'success' : c === '情景记忆' ? 'warn' : 'default';

export function VaultExplorer() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<'全部' | MemoryCategory>('全部');
  const [agent, setAgent] = useState<string>('全部');
  const [active, setActive] = useState<MemoryRecord | null>(null);
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 仅在客户端检测，避免 SSR/CSR 不一致；默认 Windows/Linux 视角 (isMac=false)。
  useEffect(() => {
    const ua = navigator.userAgent || '';
    const platform = (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform || navigator.platform || '';
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(platform) || /Macintosh/i.test(ua));
  }, []);

  // 全局快捷键：⌘K / Ctrl+K 聚焦搜索框。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const agents = useMemo(
    () => ['全部', ...Array.from(new Set(MOCK_MEMORIES.map((m) => m.agentId)))],
    [],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return MOCK_MEMORIES.filter((m) => {
      if (category !== '全部' && m.category !== category) return false;
      if (agent !== '全部' && m.agentId !== agent) return false;
      if (!needle) return true;
      return (
        m.summary.toLowerCase().includes(needle) ||
        m.tags.some((t) => t.toLowerCase().includes(needle)) ||
        m.triggers.some((t) => t.toLowerCase().includes(needle)) ||
        m.sessionId.toLowerCase().includes(needle)
      );
    });
  }, [q, category, agent]);

  return (
    <div className="mx-auto max-w-7xl px-6">
      {/* Spotlight 搜索 */}
      <div className="hm-card p-1.5 mb-6 flex items-center gap-2 shadow-floating">
        <span className="pl-4 pr-1 hm-subtle">⌕</span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索记忆 · 标签 · 触发场景 · Session ID …"
          className="flex-1 bg-transparent outline-none text-[15px] py-3 placeholder:text-ink-tertiary"
        />
        <kbd
          className="hm-chip mr-3 font-medium gap-1"
          title={isMac ? '⌘ + K · 聚焦搜索' : 'Ctrl + K · 聚焦搜索'}
        >
          {isMac ? (
            <>
              <span aria-label="Command">⌘</span>
              <span>K</span>
            </>
          ) : (
            <>
              <span aria-label="Ctrl">Ctrl</span>
              <span className="opacity-50">+</span>
              <span>K</span>
            </>
          )}
        </kbd>
      </div>

      {/* 筛选条 */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 h-7 rounded-full text-[12.5px] font-medium transition-colors ${
                category === c
                  ? 'bg-surface dark:bg-surface-dark text-ink-primary dark:text-ink-inverse shadow-hairline'
                  : 'hm-subtle hover:text-ink-primary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="h-9 px-3 rounded-full text-[12.5px] bg-black/[0.04] dark:bg-white/[0.06] hm-subtle outline-none"
        >
          {agents.map((a) => (
            <option key={a} value={a}>
              Agent · {a}
            </option>
          ))}
        </select>

        <span className="ml-auto hm-subtle text-[12.5px]">
          共 <b className="text-ink-primary dark:text-ink-inverse">{filtered.length}</b> 条记忆
        </span>
      </div>

      {/* 数据网格 */}
      <div className="hm-card overflow-hidden">
        <div className="grid grid-cols-[120px_1fr_220px_140px_90px] px-6 py-3 text-[11.5px] uppercase tracking-[0.16em] hm-subtle border-b hm-hairline">
          <span>类别</span>
          <span>摘要</span>
          <span>标签 / 触发</span>
          <span>会话 · 时间</span>
          <span className="text-right">置信</span>
        </div>
        <div className="divide-y hm-hairline">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => setActive(m)}
              className="w-full text-left grid grid-cols-[120px_1fr_220px_140px_90px] px-6 py-4 hover:bg-black/[0.025] dark:hover:bg-white/[0.04] transition-colors items-start"
            >
              <div className="pt-0.5">
                <Chip variant={variantForCategory(m.category)}>{m.category}</Chip>
              </div>
              <div className="pr-4 text-[14px] leading-relaxed">{m.summary}</div>
              <div className="flex flex-wrap gap-1.5 pr-4">
                {m.tags.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
                {m.triggers.map((t) => (
                  <Chip variant="accent" key={t}>
                    · {t}
                  </Chip>
                ))}
              </div>
              <div className="text-[12.5px] hm-subtle">
                <div className="font-mono truncate">{m.sessionId}</div>
                <div className="mt-1">{m.createdAt}</div>
              </div>
              <div className="text-right tabular-nums font-medium">
                {(m.confidence * 100).toFixed(0)}
                <span className="hm-subtle text-[11px]">%</span>
              </div>
            </button>
          ))}
          {!filtered.length && (
            <div className="py-16 text-center hm-subtle text-[14px]">没有匹配的记忆。</div>
          )}
        </div>
      </div>

      {/* 详情侧滑 */}
      {active && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
          onClick={() => setActive(null)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-canvas dark:bg-canvas-dark border-l hm-hairline overflow-y-auto animate-rise"
          >
            <header className="px-6 pt-6 pb-4 border-b hm-hairline flex items-center justify-between">
              <div>
                <div className="text-[11.5px] uppercase tracking-[0.18em] text-accent">
                  Memory · {active.id}
                </div>
                <h3 className="mt-2 text-[20px] font-semibold tracking-apple">{active.category}</h3>
              </div>
              <button
                className="h-9 w-9 rounded-full hm-subtle hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                onClick={() => setActive(null)}
              >
                ✕
              </button>
            </header>
            <div className="px-6 py-6 space-y-6 text-[14px] leading-relaxed">
              <p>{active.summary}</p>
              <Section label="标签">
                <div className="flex flex-wrap gap-1.5">
                  {active.tags.map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </Section>
              <Section label="触发场景">
                <div className="flex flex-wrap gap-1.5">
                  {active.triggers.map((t) => (
                    <Chip variant="accent" key={t}>
                      {t}
                    </Chip>
                  ))}
                </div>
              </Section>
              <div className="grid grid-cols-2 gap-4 text-[12.5px] hm-subtle">
                <Kv k="Agent" v={active.agentId} />
                <Kv k="租户" v={active.tenant} />
                <Kv k="Session" v={active.sessionId} mono />
                <Kv k="创建时间" v={active.createdAt} />
                <Kv k="TTL" v={`${active.ttlHours}h`} />
                <Kv k="置信度" v={`${(active.confidence * 100).toFixed(0)}%`} />
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-[0.16em] hm-subtle mb-2">{label}</div>
      {children}
    </div>
  );
}

function Kv({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.16em] hm-subtle">{k}</div>
      <div
        className={`mt-1 text-ink-primary dark:text-ink-inverse text-[13px] ${
          mono ? 'font-mono' : ''
        }`}
      >
        {v}
      </div>
    </div>
  );
}
