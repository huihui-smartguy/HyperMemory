import { PageHeader } from '@/components/ui/PageHeader';
import { VaultExplorer } from '@/components/vault/VaultExplorer';

export const metadata = { title: '记忆金库 · HyperMemory' };

export default function VaultPage() {
  return (
    <>
      <PageHeader
        eyebrow="基础面板 · 稳态业务区"
        title="记忆金库"
        description="结构化展示系统摄入的所有原始记忆与格式化结果。Spotlight 搜索全局检索，沉浸式数据网格保留极致信息密度。"
      />
      <VaultExplorer />
    </>
  );
}
