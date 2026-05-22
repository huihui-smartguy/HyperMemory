'use client';

import { useEffect, useState } from 'react';

interface Props {
  chunks: string[];
  intervalMs?: number;
  charMs?: number;
}

// 模拟 SSE 打字机：逐字符吐出，结束后 4s 自动循环（演示用）。
export function ReasoningStream({ chunks, intervalMs = 700, charMs = 22 }: Props) {
  const [chunkIdx, setChunkIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      const reset = setTimeout(() => {
        setDone(false);
        setChunkIdx(0);
        setCharIdx(0);
      }, 5000);
      return () => clearTimeout(reset);
    }

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

  const rendered = chunks.slice(0, chunkIdx);
  const typing = chunkIdx < chunks.length ? chunks[chunkIdx].slice(0, charIdx) : '';

  return (
    <div className="hm-glass rounded-2xl px-5 py-4 font-mono text-[12.5px] leading-relaxed">
      <div className="flex items-center justify-between mb-2">
        <span className="hm-chip-accent">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-1.5 animate-pulse" />
          REASONING_CHUNK · SSE
        </span>
        <span className="hm-subtle text-[11px]">
          {done ? 'STREAM_END · 4s 后重播' : `正在推流 · 段 ${Math.min(chunkIdx + 1, chunks.length)}/${chunks.length}`}
        </span>
      </div>
      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-2">
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
