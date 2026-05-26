import { describe, expect, it } from 'vitest';
import {
  formatCreatedAt,
  recallLogToSpans,
  recallLogToTraceSummary,
  recallToMemoryRecord,
  type NMRecallLog,
  type NMRecallResult,
} from '../novamem';

describe('formatCreatedAt', () => {
  it('formats ISO to YYYY-MM-DD HH:mm', () => {
    expect(formatCreatedAt('2026-05-21T17:42:00Z')).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
  });
  it('returns empty for null/undefined', () => {
    expect(formatCreatedAt(null)).toBe('');
    expect(formatCreatedAt(undefined)).toBe('');
  });
  it('tolerates bad ISO', () => {
    expect(formatCreatedAt('not-a-date')).toBe('not-a-date');
  });
});

describe('recallToMemoryRecord', () => {
  const sample: NMRecallResult = {
    memory: {
      id: 'nm_abc',
      scope: { user_id: 'wealth-01', session_id: 'sess_1', agent_id: 'agent-101' },
      kind: 'active',
      content: '用户在过去 14 天连续 3 次拒绝高风险股票基金推荐。',
      tags: ['偏好漂移', '避险'],
      ttl_seconds: 720 * 3600,
      created_at: '2026-05-21T17:42:00Z',
    },
    scoring: { relevance: 0.92, recency: 0.8, importance: 0.7, signals: ['拒绝高风险资产'] },
  };

  it('maps core fields including userId', () => {
    const r = recallToMemoryRecord(sample, '理财部 · Wealth-01');
    expect(r.id).toBe('nm_abc');
    expect(r.userId).toBe('wealth-01');
    expect(r.sessionId).toBe('sess_1');
    expect(r.agentId).toBe('agent-101');
    expect(r.tenant).toBe('理财部 · Wealth-01');
    expect(r.summary).toContain('拒绝高风险股票基金');
    expect(r.tags).toEqual(['偏好漂移', '避险']);
    expect(r.triggers).toEqual(['拒绝高风险资产']);
    expect(r.ttlHours).toBe(720);
    expect(r.confidence).toBeCloseTo(0.92, 5);
    expect(r.category).toBe('语义记忆'); // kind=active → 语义记忆（事实记忆 已移除）
  });

  it('prefers semantic_category over kind', () => {
    const r = recallToMemoryRecord(
      { memory: { ...sample.memory, semantic_category: '画像规则' }, scoring: sample.scoring },
      'X',
    );
    expect(r.category).toBe('画像规则');
  });

  it('tolerates missing scope / scoring (userId defaults to unknown)', () => {
    const r = recallToMemoryRecord(
      { memory: { id: 'nm_x', content: 'hello' } },
      'T',
    );
    expect(r.userId).toBe('unknown');
    expect(r.sessionId).toBe('unknown');
    expect(r.agentId).toBe('unknown');
    expect(r.tags).toEqual([]);
    expect(r.triggers).toEqual([]);
    expect(r.ttlHours).toBe(0);
    expect(r.confidence).toBe(0);
    expect(r.category).toBe('语义记忆'); // 默认兜底
  });

  it('truncates summary to 200 chars with ellipsis, keeps rawContent full', () => {
    const long = 'a'.repeat(300);
    const r = recallToMemoryRecord({ memory: { id: 'x', content: long } }, 'T');
    expect(r.summary.length).toBe(200);
    expect(r.summary.endsWith('…')).toBe(true);
    // rawContent 不截断
    expect(r.rawContent.length).toBe(300);
    expect(r.rawContent).toBe(long);
  });

  it('maps kind=stale to 情景记忆 and kind=archived to 语义记忆', () => {
    const stale = recallToMemoryRecord(
      { memory: { id: 'a', content: 'x', kind: 'stale' } },
      'T',
    );
    expect(stale.category).toBe('情景记忆');
    const archived = recallToMemoryRecord(
      { memory: { id: 'b', content: 'y', kind: 'archived' } },
      'T',
    );
    expect(archived.category).toBe('语义记忆');
  });

  it('clamps relevance to [0,1]', () => {
    const r = recallToMemoryRecord(
      { memory: { id: 'x', content: 'c' }, scoring: { relevance: 1.5 } },
      'T',
    );
    expect(r.confidence).toBe(1);
  });
});

describe('recallLogToTraceSummary', () => {
  const log: NMRecallLog = {
    id: 'tr_a',
    query: '推荐一些稳健理财',
    scope: { user_id: 'wealth-01', agent_id: 'agent-101' },
    duration_ms: 138,
    top_k: 8,
    created_at: '2026-05-22T18:00:00Z',
    results_count: 6,
  };

  it('maps base fields and classifies intent=recommend', () => {
    const s = recallLogToTraceSummary(log);
    expect(s.traceId).toBe('tr_a');
    expect(s.intent).toBe('recommend');
    expect(s.totalMs).toBe(138);
    expect(s.agentId).toBe('agent-101');
  });

  it('assigns warn when duration > 200', () => {
    expect(recallLogToTraceSummary({ ...log, duration_ms: 250 }).status).toBe('warn');
  });

  it('assigns ok when duration <= 200', () => {
    expect(recallLogToTraceSummary({ ...log, duration_ms: 100 }).status).toBe('ok');
  });

  it('defaults agentId to unknown when scope missing', () => {
    expect(recallLogToTraceSummary({ ...log, scope: null }).agentId).toBe('unknown');
  });
});

describe('recallLogToSpans', () => {
  const log: NMRecallLog = {
    id: 'tr_a',
    query: 'q',
    duration_ms: 100,
    top_k: 8,
    created_at: '2026-05-22T18:00:00Z',
  };

  it('produces 5 ordered spans whose durations sum to total', () => {
    const spans = recallLogToSpans(log);
    expect(spans).toHaveLength(5);
    const sum = spans.reduce((a, s) => a + s.durationMs, 0);
    expect(sum).toBe(100);
    // start offsets monotonically increase
    for (let i = 1; i < spans.length; i++) {
      expect(spans[i].start).toBeGreaterThanOrEqual(spans[i - 1].start);
    }
  });
});
