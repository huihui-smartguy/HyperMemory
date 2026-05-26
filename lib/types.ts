export type MemoryCategory = '语义记忆' | '画像规则' | '情景记忆';

export interface MemoryRecord {
  id: string;
  userId: string;          // 后端 scope.user_id，多用户系统中区分不同用户的记忆
  sessionId: string;
  agentId: string;
  tenant: string;          // 组织级多租户显示名（如「理财部 · Wealth-01」）
  category: MemoryCategory;
  summary: string;         // 截断 200 字 · 网格展示
  rawContent: string;      // 后端 content 全文 · 详情面板展示
  tags: string[];
  triggers: string[];
  ttlHours: number;
  createdAt: string;
  confidence: number;
}

export interface SchemaNode {
  id: string;
  type: 'skill' | 'general';
  name: string;
  version: string;
  status: 'stable' | 'evolving' | 'draft';
  children?: SchemaNode[];
}

export interface SchemaDraft {
  id: string;
  title: string;
  surprise: number;
  triggeredBy: string;
  oldMarkdown: string;
  newMarkdown: string;
  status: 'AWAITING_APPROVAL' | 'ACCEPTED' | 'REFINED';
}

export interface PipelineStage {
  id: string;
  label: string;
  state: 'idle' | 'running' | 'ok' | 'warn';
  throughput: string;
}

export interface CausalNode {
  id: string;
  label: string;
  kind: 'user' | 'fact' | 'skill' | 'counterfactual' | 'rule';
}
export interface CausalEdge {
  source: string;
  target: string;
  counterfactual?: boolean;
  weight?: number;
}

export interface TraceSpan {
  module: string;
  operation: string;
  durationMs: number;
  start: number;
  status: 'ok' | 'warn' | 'error';
  detail?: Record<string, unknown>;
}

export interface KpiPoint {
  t: string;
  v: number;
}
