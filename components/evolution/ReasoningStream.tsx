'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  chunks: string[];
  intervalMs?: number;
  charMs?: number;
}

// 模拟 SSE 打字机：逐字符吐出，单次播放结束后停留终态；用户可手动重播。
// 容器固定高度避免内容增长导致整页 Layout Shift。
export function ReasoningStream({ chunks, intervalMs = 700, charMs = 22 }: Props) {
  const [chunkIdx, setChunkIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done) return;

    if (chunkIdx >= chunks.length) {
      setDone(true);
      return;
    }
    const current = chunks[chunkIdx];
    if (charIdx < current.length) {
      const t = setTimeout(() => setCharIdx(charIdx + 1), charMs);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setChunkIdx(chunkIdx + 1);
      setCharIdx(0);
    }, intervalMs);
    return () => clearTimeout(t);
  }, [chunkIdx, charIdx, done, chunks, intervalMs, charMs]);

  // 内容追加时，平滑滚动到底部 —— 仅滚动内部容器，不影响外部页面。
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chunkIdx, charIdx]);

  const replay = () => {
    setDone(false);
    setChunkIdx(0);
    setCharIdx(0);
  };

  const rendered = chunks.slice(0, chunkIdx);
  const typing = chunkIdx < chunks.length ? chunks[chunkIdx].slice(0, charIdx) : '';

  return (
    <div className="hm-glass rounded-2xl px-5 py-4 font-mono text-[12.5px] leading-relaxed">
      <div className="flex items-center justify-between mb-2">
        <span className="hm-chip-accent">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full bg-accent mr-1.5 ${
              done ? '' : 'animate-pulse'
            }`}
          />
          REASONING_CHUNK · SSE
        </span>
        <div className="flex items-center gap-3">
          <span className="hm-subtle text-[11px]">
            {done
              ? `STREAM_END · 共 ${chunks.length} 段`
              : `正在推流 · 段 ${Math.min(chunkIdx + 1, chunks.length)}/${chunks.length}`}
          </span>
          {done && (
            <button
              onClick={replay}
              className="text-[11px] text-accent hover:text-accent-hover transition-colors"
            >
              ↺ 重播
            </button>
          )}
        </div>
      </div>
      {/* 固定高度 + 内部滚动，避免页面 Layout Shift */}
      <div
        ref={scrollRef}
        className="space-y-1.5 h-44 overflow-y-auto pr-2"
      >
        {rendered.map((line, i) => (
          <div key={i} className="text-ink-primary dark:text-ink-inverse">
            <span className="hm-subtle mr-2">›</span>
            {line}
          </div>
        ))}
        {!done && (
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
