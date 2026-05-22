import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { CausalGraph } from '@/components/graph/CausalGraph';
import { PipelineLanes } from '@/components/graph/PipelineLanes';
import { MOCK_CAUSAL_EDGES, MOCK_CAUSAL_NODES, MOCK_PIPELINE } from '@/lib/mocks/graph';

export const metadata = { title: '认知拓扑引擎 · HyperMemory' };

export default function CognitiveGraphPage() {
  return (
    <>
      <PageHeader
        eyebrow="进阶面板 · 敏态进化区"
        title="认知拓扑引擎"
        description="将记忆从摄入到图谱编译的全生命周期可视化。管道泳道展示流转状态，因果图谱中反事实提取链路以紫色虚线高亮，节点支持拖拽干预。"
      />

      <div className="mx-auto max-w-7xl px-6 space-y-6">
        <Card title="记忆生命周期管道" subtitle="raw.md → 脱敏 → 去重 → 提取 → 编译 → 反事实推演">
          <PipelineLanes stages={MOCK_PIPELINE} />
        </Card>

        <Card
          title="因果图谱编辑器"
          subtitle="用户 · 事实 · Skill · 反事实 · 规则 — 拖拽节点可触发人工干预"
        >
          <CausalGraph nodes={MOCK_CAUSAL_NODES} edges={MOCK_CAUSAL_EDGES} />
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
    </>
  );
}
