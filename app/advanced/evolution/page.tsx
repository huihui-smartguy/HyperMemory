import { PageHeader } from '@/components/ui/PageHeader';
import { EvolutionFactory } from '@/components/evolution/EvolutionFactory';

export const metadata = { title: 'Schema 进化车间 · HyperMemory' };

export default function EvolutionPage() {
  return (
    <>
      <PageHeader
        eyebrow="进阶面板 · 敏态进化区"
        title="Schema 进化车间"
        description="承载基于惊喜度计算触发的 Schema 优化建议。顶部为打字机形态的推理流，下方为 Monaco Diff 视窗，承接人机协同审批闭环。"
      />
      <EvolutionFactory />
    </>
  );
}
