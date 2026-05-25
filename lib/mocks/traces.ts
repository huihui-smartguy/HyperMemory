import type { TraceSpan } from '../types';

export const MOCK_TRACE_SPANS: TraceSpan[] = [
  {
    module: 'Go · Gateway',
    operation: 'JWT 鉴权 · 限流 · 租户路由',
    durationMs: 5,
    start: 0,
    status: 'ok',
    detail: { tenant: 'Wealth-01', rateLimit: '12k/s', authMs: 1.8 },
  },
  {
    module: 'Python · TPO',
    operation: '意图分类 · Search-Recommend-Ask',
    durationMs: 28,
    start: 5,
    status: 'ok',
    detail: { intent: 'recommend+ask', confidence: 0.93 },
  },
  {
    module: 'Python · Router',
    operation: '自适应多路召回决策',
    durationMs: 9,
    start: 33,
    status: 'ok',
    detail: { strategy: 'vector∥relational', concurrent: true },
  },
  {
    module: 'Milvus · shard-02',
    operation: '向量 ANN 检索 (TopK=64)',
    durationMs: 31,
    start: 42,
    status: 'ok',
    detail: { ef: 96, topK: 64, recall: 0.97 },
  },
  {
    module: 'PostgreSQL · primary',
    operation: '静态画像精准查询',
    durationMs: 14,
    start: 42,
    status: 'ok',
    detail: { sql: 'SELECT * FROM user_profile WHERE uid=$1' },
  },
  {
    module: 'Python · TPO',
    operation: 'TPO 权重干预 (避险偏好)',
    durationMs: 11,
    start: 73,
    status: 'warn',
    detail: {
      preferenceDrift: 0.88,
      reweight: [
        { category: '股票型基金', factor: 0.2 },
        { category: '货币 / 短债', factor: 1.6 },
      ],
    },
  },
  {
    module: 'Python · Rerank',
    operation: '重排序 + 去重',
    durationMs: 17,
    start: 84,
    status: 'ok',
    detail: { duped: 6, finalK: 8 },
  },
  {
    module: 'Go · Gateway',
    operation: '上下文回传 · 注入 Prompt',
    durationMs: 6,
    start: 101,
    status: 'ok',
    detail: { promptTokens: 1284 },
  },
];

export const MOCK_TRACE_HISTORY = [
  { traceId: 'tr_6b21f9_e7a44c1d', intent: 'recommend+ask', totalMs: 107, status: 'ok' as const, startedAt: '2026-05-22T18:01:23Z', agentId: 'agent-101' },
  { traceId: 'tr_6b21f8_9af33c01', intent: 'search', totalMs: 64, status: 'ok' as const, startedAt: '2026-05-22T18:00:55Z', agentId: 'agent-101' },
  { traceId: 'tr_6b21f7_b21199aa', intent: 'ask', totalMs: 41, status: 'ok' as const, startedAt: '2026-05-22T18:00:32Z', agentId: 'agent-101' },
  { traceId: 'tr_6b21f6_4e90ff12', intent: 'recommend', totalMs: 138, status: 'warn' as const, startedAt: '2026-05-22T18:00:01Z', agentId: 'agent-202' },
  { traceId: 'tr_6b21f5_aaee2371', intent: 'recommend+ask', totalMs: 92, status: 'ok' as const, startedAt: '2026-05-22T17:59:14Z', agentId: 'agent-101' },
];
