'use client';

import { useEffect, useRef, useState } from 'react';
import { ENDPOINTS, SSE_LIVE } from '@/lib/api/config';

interface Props {
  /** mock 模式 / SSE 失败时使用的本地 chunks 兜底（按段输出） */
  fallbackChunks?: string[];
  /** 用于 SSE 过滤事件 payload 中的 draftId（可选） */
  draftNodeId?: string;
  intervalMs?: number;
  charMs?: number;
}

type RunState = 'connecting' | 'streaming' | 'done' | 'error';

export function ReasoningStream({
  fallbackChunks = [],
  draftNodeId,
  intervalMs = 700,
  charMs = 22,
}: Props) {
  const [lines, setLines] = useState<string[]>([]);
  const [typing, setTyping] = useState('');
  const [state, setState] = useState<RunState>('connecting');
  const [transport, setTransport] = useState<'sse' | 'local' | 'idle'>('idle');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 内容追加时自动滚到底部
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, typing]);

  /* ---------- 真实 SSE 通道 (bff/live + SSE_LIVE) ---------- */
  useEffect(() => {
    if (!SSE_LIVE) return; // 走本地模拟
    setTransport('sse');
    setState('connecting');
    setLines([]);
    setTyping('');

    let buf = '';
    const sse = new EventSource(ENDPOINTS.schema.stream, { withCredentials: true });

    sse.addEventListener('surprise_alert', () => {
      setState('streaming');
    });

    sse.addEventListener('reasoning_chunk', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data) as { chunk: string; draftId?: string };
        // 按字符流入，按"段"切分换行
        for (const ch of payload.chunk) {
          if (ch === '\n') {
            const line = buf;
            buf = '';
            setLines((prev) => [...prev, line]);
          } else {
            buf += ch;
          }
        }
        setTyping(buf);
      } catch {}
      setState('streaming');
    });

    sse.addEventListener('schema_diff', () => {
      if (buf) {
        setLines((prev) => [...prev, buf]);
        buf = '';
        setTyping('');
      }
      setState('done');
    });

    sse.addEventListener('stream_error', () => {
      setState('error');
    });

    sse.onerror = () => {
      setState('error');
      sse.close();
    };

    return () => sse.close();
  }, [draftNodeId]);

  /* ---------- 本地模拟通道 (mock 模式) ---------- */
  useEffect(() => {
    if (SSE_LIVE) return;
    setTransport('local');
    setState('connecting');
    setLines([]);
    setTyping('');

    let chunkIdx = 0;
    let charIdx = 0;
    let cancelled = false;
    const total = fallbackChunks.length;

    const tick = () => {
      if (cancelled) return;
      if (chunkIdx >= total) {
        setState('done');
        return;
      }
      const current = fallbackChunks[chunkIdx];
      if (charIdx < current.length) {
        charIdx += 1;
        setTyping(current.slice(0, charIdx));
        setTimeout(tick, charMs);
      } else {
        setLines((prev) => [...prev, current]);
        setTyping('');
        chunkIdx += 1;
        charIdx = 0;
        setTimeout(tick, intervalMs);
      }
      setState('streaming');
    };
    tick();

    return () => {
      cancelled = true;
    };
  }, [fallbackChunks, charMs, intervalMs]);

  return (
    <div className="hm-glass rounded-2xl px-5 py-4 font-mono text-[12.5px] leading-relaxed">
      <div className="flex items-center justify-between mb-2">
        <span className="hm-chip-accent">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full bg-accent mr-1.5 ${
              state === 'done' ? '' : 'animate-pulse'
            }`}
          />
          REASONING_CHUNK · {transport === 'sse' ? 'SSE (real)' : 'LOCAL'}
        </span>
        <span className="hm-subtle text-[11px]">
          {state === 'done'
            ? `STREAM_END · 共 ${lines.length} 段`
            : state === 'error'
              ? '连接失败 · 回落 mock'
              : `正在推流 · ${lines.length} 段已落地`}
        </span>
      </div>
      <div ref={scrollRef} className="space-y-1.5 h-44 overflow-y-auto pr-2">
        {lines.map((line, i) => (
          <div key={i} className="text-ink-primary dark:text-ink-inverse">
            <span className="hm-subtle mr-2">›</span>
            {line}
          </div>
        ))}
        {state !== 'done' && (
          <div className="text-ink-primary dark:text-ink-inverse">
            <span className="hm-subtle mr-2">›</span>
            {typing}
            <span className="inline-block w-1.5 h-4 align-[-2px] bg-accent animate-caret ml-0.5" />
          </div>
        )}
      </div>
    </div>
  );
}
