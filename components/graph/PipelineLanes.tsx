import type { PipelineStage } from '@/lib/types';

const STATE_STYLE: Record<PipelineStage['state'], { ring: string; label: string; chip: string }> = {
  idle: { ring: 'bg-black/[0.04] text-ink-secondary', label: '待机', chip: 'hm-chip' },
  running: { ring: 'bg-accent-mute text-accent', label: '处理中', chip: 'hm-chip-accent' },
  ok: { ring: 'bg-signal-success/10 text-signal-success', label: '健康', chip: 'hm-chip' },
  warn: { ring: 'bg-signal-warning/10 text-signal-warning', label: '关注', chip: 'hm-chip' },
};

export function PipelineLanes({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="relative">
      <div className="absolute left-0 right-0 top-7 h-px bg-hairline dark:bg-hairline-dark" />
      <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stages.map((s, i) => {
          const style = STATE_STYLE[s.state];
          return (
            <div key={s.id} className="flex flex-col items-center text-center">
              <div
                className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center text-[15px] font-semibold ${style.ring} border hm-hairline bg-surface dark:bg-surface-dark`}
              >
                {i + 1}
                {s.state === 'running' && (
                  <span className="absolute inset-0 rounded-full ring-2 ring-accent/50 animate-pulse" />
                )}
              </div>
              <div className="mt-3 text-[13px] font-medium tracking-apple">{s.label}</div>
              <div className="mt-1 text-[11.5px] hm-subtle">{s.throughput}</div>
              <div className="mt-2">
                <span
                  className={
                    s.state === 'warn'
                      ? 'inline-flex items-center px-2 h-5 rounded-full text-[11px] font-medium text-signal-warning bg-signal-warning/10'
                      : s.state === 'running'
                        ? 'inline-flex items-center px-2 h-5 rounded-full text-[11px] font-medium text-accent bg-accent-mute'
                        : 'inline-flex items-center px-2 h-5 rounded-full text-[11px] font-medium text-signal-success bg-signal-success/10'
                  }
                >
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
