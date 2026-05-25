'use client';

import { Card } from '@/components/ui/Card';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { CausalGraph } from './CausalGraph';
import { PipelineLanes } from './PipelineLanes';
import { useGraphData } from '@/lib/api/hooks';
import { MOCK_CAUSAL_EDGES, MOCK_CAUSAL_NODES, MOCK_PIPELINE } from '@/lib/mocks/graph';

export function GraphPanels() {
  const { data: envelope } = useGraphData();
  const data = envelope?.data ?? {
    pipeline: MOCK_PIPELINE,
    causal: { nodes: MOCK_CAUSAL_NODES, edges: MOCK_CAUSAL_EDGES },
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
          管道首节点由 NovaMem /health 探活动态反映；因果图谱待后端 graph_db 实装。
        </span>
      </div>

      <Card title="记忆生命周期管道" subtitle="raw.md → 脱敏 → 去重 → 提取 → 编译 → 反事实推演">
        <PipelineLanes stages={data.pipeline} />
      </Card>

      <Card
        title="因果图谱编辑器"
        subtitle="用户 · 事实 · Skill · 反事实 · 规则 — 拖拽节点可触发人工干预"
      >
        <CausalGraph nodes={data.causal.nodes} edges={data.causal.edges} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          ['12,418', '本小时摄入条数'],
          ['8,754', '滑动窗口已提取'],
          ['0.91', '当前最高惊喜度'],
        ].map(([v, k]) => (
          <div key={k} className="hm-card p-5">
            <div className="text-[28px] font-semibold tracking-apple tabular-nums">{v}</div>
            <div className="mt-1 text-[12.5px] hm-subtle">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
