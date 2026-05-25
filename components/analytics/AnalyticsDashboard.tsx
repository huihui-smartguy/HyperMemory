'use client';

import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EChart } from '@/components/charts/EChart';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { useAnalytics } from '@/lib/api/hooks';
import {
  MOCK_CATEGORY_PIE,
  MOCK_KPI_CARDS,
  MOCK_LATENCY,
  MOCK_NODE_HEALTH,
  MOCK_THROUGHPUT,
  MOCK_TTL_RECYCLE,
} from '@/lib/mocks/analytics';

const APPLE_GRID = { left: 32, right: 16, top: 24, bottom: 24, containLabel: true };
const AXIS_STYLE = {
  axisLine: { lineStyle: { color: 'rgba(120,120,128,0.32)' } },
  axisTick: { show: false },
  axisLabel: { color: '#86868B', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(120,120,128,0.16)', type: 'dashed' as const } },
};

export function AnalyticsDashboard() {
  const { data: envelope } = useAnalytics();
  const bundle = envelope?.data ?? {
    kpi: MOCK_KPI_CARDS,
    throughput: MOCK_THROUGHPUT,
    latency: MOCK_LATENCY,
    category: MOCK_CATEGORY_PIE,
    nodes: MOCK_NODE_HEALTH,
    ttl: MOCK_TTL_RECYCLE,
  };

  const throughputOption = {
    grid: APPLE_GRID,
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    xAxis: { type: 'category', data: bundle.throughput.map((p) => p.t), ...AXIS_STYLE, boundaryGap: false },
    yAxis: { type: 'value', ...AXIS_STYLE },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#0071E3', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(0,113,227,0.22)' },
              { offset: 1, color: 'rgba(0,113,227,0)' },
            ],
          },
        },
        data: bundle.throughput.map((p) => p.v),
      },
    ],
  };

  const latencyOption = {
    grid: APPLE_GRID,
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: bundle.latency.map((p) => p.t), ...AXIS_STYLE, boundaryGap: false },
    yAxis: { type: 'value', ...AXIS_STYLE, axisLabel: { ...AXIS_STYLE.axisLabel, formatter: '{value} ms' } },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#34C759', width: 2 },
        data: bundle.latency.map((p) => p.v),
      },
    ],
  };

  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, icon: 'circle', textStyle: { color: '#6E6E73' } },
    series: [
      {
        type: 'pie',
        radius: ['55%', '78%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: bundle.category.map((p) => ({
          name: p.name,
          value: p.value,
          itemStyle: { color: p.color },
        })),
      },
    ],
  };

  const ttlOption = {
    grid: APPLE_GRID,
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { textStyle: { color: '#6E6E73' }, top: 0 },
    xAxis: { type: 'category', data: bundle.ttl.map((d) => d.day), ...AXIS_STYLE },
    yAxis: { type: 'value', ...AXIS_STYLE },
    series: [
      {
        name: '总写入',
        type: 'bar',
        barWidth: 14,
        itemStyle: { color: '#0071E3', borderRadius: [6, 6, 0, 0] },
        data: bundle.ttl.map((d) => d.total),
      },
      {
        name: 'TTL 回收',
        type: 'bar',
        barWidth: 14,
        itemStyle: { color: '#FF9F0A', borderRadius: [6, 6, 0, 0] },
        data: bundle.ttl.map((d) => d.reclaimed),
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-6 space-y-6">
      <div className="flex items-center gap-2">
        <DataSourceBadge
          source={envelope?.source}
          mockFields={envelope?.mockFields}
          mockReason={envelope?.mockReason}
        />
        <span className="hm-subtle text-[12px]">
          NovaMem 暂未提供大盘聚合端点，多数指标为 mock 兜底。
        </span>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {bundle.kpi.map((k) => (
          <div key={k.label} className="hm-card p-5">
            <div className="text-[12px] hm-subtle">{k.label}</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-[28px] font-semibold tracking-apple tabular-nums">{k.value}</div>
              <Chip variant={k.positive ? 'success' : 'danger'}>{k.delta}</Chip>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="API 吞吐量" subtitle="过去 24 小时 · QPS" className="lg:col-span-2">
          <EChart option={throughputOption} />
        </Card>
        <Card title="记忆分类构成" subtitle="事实 · 语义 · 画像 · 情景">
          <EChart option={pieOption} />
        </Card>
        <Card title="Go 网关 P99 延迟" subtitle="过去 24 小时 · 毫秒" className="lg:col-span-2">
          <EChart option={latencyOption} />
        </Card>
        <Card title="TTL 生命周期回收" subtitle="近 7 天 · 总写入 / 回收对比">
          <EChart option={ttlOption} />
        </Card>
      </div>

      <Card title="存储节点健康度" subtitle="Milvus / PostgreSQL / Redis 集群">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundle.nodes.map((n) => (
            <div key={n.node} className="border hm-hairline rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium text-[13.5px]">{n.node}</div>
                <Chip variant={n.status === 'warn' ? 'warn' : 'success'}>
                  {n.status === 'warn' ? '关注' : '健康'}
                </Chip>
              </div>
              <Meter label="CPU" value={n.cpu} warn={n.cpu > 70} />
              <Meter label="内存" value={n.mem} warn={n.mem > 80} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Meter({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[12px] hm-subtle">
        <span>{label}</span>
        <span className="tabular-nums">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
        <div
          className={`h-full ${warn ? 'bg-signal-warning' : 'bg-accent'}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
