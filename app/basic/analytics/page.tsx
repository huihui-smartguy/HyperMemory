import { PageHeader } from '@/components/ui/PageHeader';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export const metadata = { title: '运行大盘 · HyperMemory' };

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        eyebrow="基础面板 · 稳态业务区"
        title="运行大盘"
        description="承载吞吐量、网关延迟、记忆分类与节点健康度等核心 SLI 指标。所有图表以浅灰发丝线 + 单色折线呈现，恪守极简语言。"
      />
      <AnalyticsDashboard />
    </>
  );
}
