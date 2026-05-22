import type { KpiPoint } from '../types';

function series(seed: number, points = 48): KpiPoint[] {
  const out: KpiPoint[] = [];
  let v = seed;
  for (let i = 0; i < points; i++) {
    const drift = Math.sin(i / 4) * seed * 0.18;
    const noise = (Math.random() - 0.5) * seed * 0.12;
    v = Math.max(0, seed + drift + noise);
    const hh = String(Math.floor(i / 2)).padStart(2, '0');
    const mm = i % 2 === 0 ? '00' : '30';
    out.push({ t: `${hh}:${mm}`, v: Math.round(v) });
  }
  return out;
}

export const MOCK_THROUGHPUT = series(820); // QPS
export const MOCK_LATENCY = series(42);     // ms

export const MOCK_CATEGORY_PIE = [
  { name: '事实记忆', value: 38, color: '#0071E3' },
  { name: '语义记忆', value: 27, color: '#5AC8FA' },
  { name: '画像规则', value: 22, color: '#FF9F0A' },
  { name: '情景记忆', value: 13, color: '#34C759' },
];

export const MOCK_NODE_HEALTH = [
  { node: 'Milvus · shard-01', cpu: 41, mem: 62, status: 'healthy' as const },
  { node: 'Milvus · shard-02', cpu: 58, mem: 71, status: 'healthy' as const },
  { node: 'Milvus · shard-03', cpu: 76, mem: 84, status: 'warn' as const },
  { node: 'PostgreSQL · primary', cpu: 33, mem: 55, status: 'healthy' as const },
  { node: 'PostgreSQL · replica', cpu: 29, mem: 47, status: 'healthy' as const },
  { node: 'Redis · cache', cpu: 18, mem: 36, status: 'healthy' as const },
];

export const MOCK_TTL_RECYCLE = [
  { day: '05-16', total: 12_300, reclaimed: 7_120 },
  { day: '05-17', total: 13_011, reclaimed: 8_002 },
  { day: '05-18', total: 11_890, reclaimed: 6_950 },
  { day: '05-19', total: 14_412, reclaimed: 9_410 },
  { day: '05-20', total: 15_201, reclaimed: 10_220 },
  { day: '05-21', total: 13_877, reclaimed: 8_801 },
  { day: '05-22', total: 9_801, reclaimed: 5_402 },
];

export const MOCK_KPI_CARDS = [
  { label: '今日 QPS 峰值', value: '12,418', delta: '+8.4%', positive: true },
  { label: 'Go 网关 P99 延迟', value: '63 ms', delta: '-4.2%', positive: true },
  { label: '在线 Schema 数', value: '241', delta: '+3', positive: true },
  { label: '惊喜度高位告警', value: '7', delta: '+2', positive: false },
];
