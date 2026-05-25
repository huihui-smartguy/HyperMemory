import { PageHeader } from '@/components/ui/PageHeader';
import { GraphPanels } from '@/components/graph/GraphPanels';

export const metadata = { title: '认知拓扑引擎 · HyperMemory' };

export default function CognitiveGraphPage() {
  return (
    <>
      <PageHeader
        eyebrow="进阶面板 · 敏态进化区"
        title="认知拓扑引擎"
        description="将记忆从摄入到图谱编译的全生命周期可视化。管道泳道展示流转状态，因果图谱中反事实提取链路以紫色虚线高亮，节点支持拖拽干预。"
      />
      <GraphPanels />
    </>
  );
}
