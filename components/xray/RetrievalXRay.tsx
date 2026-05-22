'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { MOCK_TRACE_HISTORY, MOCK_TRACE_SPANS } from '@/lib/mocks/traces';
import type { TraceSpan } from '@/lib/types';

const MODULE_COLOR: Record<string, string> = {
  'Go · Gateway': '#0071E3',
  'Python · TPO': '#AF52DE',
  'Python · Router': '#5AC8FA',
  'Python · Rerank': '#FF9F0A',
  'Milvus · shard-02': '#34C759',
  'PostgreSQL · primary': '#FF3B30',
};

const colorOf = (m: string) => MODULE_COLOR[m] ?? '#86868B';

export function RetrievalXRay() {
  const [activeTrace, setActiveTrace] = useState(MOCK_TRACE_HISTORY[0].traceId);
  const [activeSpan, setActiveSpan] = useState<TraceSpan | null>(null);
  const total = useMemo(
    () => Math.max(...MOCK_TRACE_SPANS.map((s) => s.start + s.durationMs)),
    [],
  );

  return (
    <div className="mx-auto max-w-7xl px-6 space-y-6">
      {/* Trace 历史 */}
      <Card title="最近请求" subtitle="点击任意 Trace 查看其链路瀑布流">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {MOCK_TRACE_HISTORY.map((t) => (
            <button
              key={t.traceId}
              onClick={() => setActiveTrace(t.traceId)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                activeTrace === t.traceId
                  ? 'border-accent bg-accent-mute'
                  : 'border-hairline dark:border-hairline-dark hover:border-ink-tertiary'
              }`}
            >
              <div className="font-mono text-[11.5px] hm-subtle truncate">{t.traceId}</div>
              <div className="mt-2 text-[14px] font-medium tracking-apple">{t.intent}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="tabular-nums text-[13px]">{t.totalMs} ms</span>
                <Chip variant={t.status === 'warn' ? 'warn' : 'success'}>
                  {t.status === 'warn' ? 'TPO 触发' : 'OK'}
                </Chip>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* 瀑布流 */}
      <Card
        title="链路瀑布流"
        subtitle={`Trace · ${activeTrace} · 总耗时 ${total} ms`}
      >
        <div className="space-y-1.5">
          {MOCK_TRACE_SPANS.map((s, i) => {
            const leftPct = (s.start / total) * 100;
            const widthPct = (s.durationMs / total) * 100;
            return (
              <button
                key={i}
                onClick={() => setActiveSpan(s)}
                className="grid grid-cols-[220px_1fr_72px] items-center gap-3 w-full text-left rounded-xl px-3 py-2 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors"
              >
                <div>
                  <div className="text-[13px] font-medium truncate">{s.module}</div>
                  <div className="text-[11.5px] hm-subtle truncate">{s.operation}</div>
                </div>
                <div className="relative h-7 rounded-md bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                  <div
                    className="absolute top-0 bottom-0 rounded-md"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 0.6)}%`,
                      background: colorOf(s.module),
                      opacity: s.status === 'warn' ? 0.75 : 0.92,
                    }}
                  />
                  {s.status === 'warn' && (
                    <div
                      className="absolute top-0 bottom-0 border-l-2 border-signal-warning"
                      style={{ left: `${leftPct}%` }}
                    />
                  )}
                </div>
                <div className="text-right tabular-nums text-[12.5px] hm-subtle">
                  {s.durationMs} ms
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Span 详情侧滑 */}
      {activeSpan && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs"
          onClick={() => setActiveSpan(null)}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-canvas dark:bg-canvas-dark border-l hm-hairline overflow-y-auto animate-rise"
          >
            <header className="px-6 pt-6 pb-4 border-b hm-hairline">
              <div className="text-[11.5px] uppercase tracking-[0.18em] text-accent">
                Span Detail
              </div>
              <h3 className="mt-2 text-[20px] font-semibold tracking-apple">{activeSpan.module}</h3>
              <p className="mt-1 hm-subtle text-[13px]">{activeSpan.operation}</p>
            </header>
            <div className="px-6 py-6 space-y-4 text-[13px] leading-relaxed">
              <div className="grid grid-cols-3 gap-4 text-[12px] hm-subtle">
                <Kv k="开始" v={`${activeSpan.start} ms`} />
                <Kv k="耗时" v={`${activeSpan.durationMs} ms`} />
                <Kv k="状态" v={activeSpan.status.toUpperCase()} />
              </div>
              <div>
                <div className="text-[11.5px] uppercase tracking-[0.18em] hm-subtle mb-2">
                  Span Payload (JSON)
                </div>
                <pre className="font-mono text-[12px] leading-relaxed bg-black/[0.04] dark:bg-white/[0.05] rounded-xl p-4 overflow-x-auto">
                  {JSON.stringify(activeSpan.detail ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.16em] hm-subtle">{k}</div>
      <div className="mt-1 text-ink-primary dark:text-ink-inverse text-[13px] tabular-nums">{v}</div>
    </div>
  );
}
