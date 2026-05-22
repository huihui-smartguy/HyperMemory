import type { CausalEdge, CausalNode, PipelineStage } from '../types';

export const MOCK_PIPELINE: PipelineStage[] = [
  { id: 'p1', label: '原始请求 · raw.md', state: 'ok', throughput: '12.4k/min' },
  { id: 'p2', label: '脱敏 · PII Mask', state: 'ok', throughput: '12.4k/min' },
  { id: 'p3', label: '去重 · Dedup', state: 'ok', throughput: '11.9k/min' },
  { id: 'p4', label: '滑动窗口提取', state: 'running', throughput: '8.7k/min' },
  { id: 'p5', label: '图谱编译', state: 'running', throughput: '8.2k/min' },
  { id: 'p6', label: '反事实推演', state: 'warn', throughput: '0.6k/min' },
];

export const MOCK_CAUSAL_NODES: CausalNode[] = [
  { id: 'u', label: '用户 #U-101', kind: 'user' },
  { id: 'f1', label: 'R2 稳健型', kind: 'fact' },
  { id: 'f2', label: '净资产 ¥620 万', kind: 'fact' },
  { id: 'f3', label: '隐私敏感', kind: 'fact' },
  { id: 's1', label: 'Skill · 理财推荐', kind: 'skill' },
  { id: 's2', label: 'Skill · 账户体检', kind: 'skill' },
  { id: 'c1', label: '反事实 · 周末激进推荐被拒', kind: 'counterfactual' },
  { id: 'r1', label: '规则 · TPO 周末权重×0.2', kind: 'rule' },
];

export const MOCK_CAUSAL_EDGES: CausalEdge[] = [
  { source: 'u', target: 'f1', weight: 0.9 },
  { source: 'u', target: 'f2', weight: 1.0 },
  { source: 'u', target: 'f3', weight: 0.8 },
  { source: 'f1', target: 's1', weight: 0.6 },
  { source: 'f3', target: 's1', weight: -0.7 },
  { source: 'f3', target: 's2', weight: 0.85 },
  { source: 'f2', target: 's1', weight: 0.5 },
  { source: 'u', target: 'c1', counterfactual: true, weight: 0.7 },
  { source: 'c1', target: 'r1', counterfactual: true, weight: 1.0 },
  { source: 'r1', target: 's1', weight: -0.8 },
  { source: 'r1', target: 's2', weight: 0.6 },
];
