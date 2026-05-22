export type MemoryCategory = '事实记忆' | '语义记忆' | '画像规则' | '情景记忆';

export interface MemoryRecord {
  id: string;
  sessionId: string;
  agentId: string;
  tenant: string;
  category: MemoryCategory;
  summary: string;
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
