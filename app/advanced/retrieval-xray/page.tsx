import { PageHeader } from '@/components/ui/PageHeader';
import { RetrievalXRay } from '@/components/xray/RetrievalXRay';

export const metadata = { title: '召回 X 光机 · NovaMem' };

export default function XRayPage() {
  return (
    <>
      <PageHeader
        eyebrow="进阶面板 · 敏态进化区"
        title="召回 X 光机"
        description="还原单次 Agent 请求背后的自适应单 / 多路召回逻辑。横向时间轴展示 Go 网关、Milvus、Postgres、TPO 与 Rerank 各 Span 的耗时分布。"
      />
      <RetrievalXRay />
    </>
  );
}
