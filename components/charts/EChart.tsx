'use client';

import dynamic from 'next/dynamic';

// echarts-for-react 在 SSR 下会触发 DOM API，必须 client-only。
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// ECharts 字面量推断对 TS 极不友好，统一接受宽松对象，由调用方负责语义正确。
export function EChart({
  option,
  height = 260,
  className = '',
}: {
  option: Record<string, unknown>;
  height?: number;
  className?: string;
}) {
  return (
    <div className={className} style={{ height }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
}
