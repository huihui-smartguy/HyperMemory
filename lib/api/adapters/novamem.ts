// NovaMem 后端类型 ↔ 前端类型 的双向 mapper。
// 集中放在这里便于 vitest 单测守护，避免字段漂移在 Route Handler 各处散落。
import type { MemoryRecord, MemoryCategory, TraceSpan } from '@/lib/types';

/* -------- 后端 schema (NovaMem) -------- */

export interface NMScope {
  user_id?: string | null;
  session_id?: string | null;
  agent_id?: string | null;
}

export interface NMMemoryItem {
  id: string;
  scope?: NMScope | null;
  /** lifecycle 状态：active | stale | archived */
  kind?: string | null;
  /** 可选语义分类（后端 P2 才会补） */
  semantic_category?: string | null;
  content: string;
  tags?: string[] | null;
  ttl_seconds?: number | null;
  created_at?: string | null;
}

export interface NMScoring {
  relevance?: number | null;
  recency?: number | null;
  importance?: number | null;
  signals?: string[] | null;
}

export interface NMRecallResult {
  memory: NMMemoryItem;
  scoring?: NMScoring | null;
}

export interface NMRecallResponse {
  results: NMRecallResult[];
}

export interface NMRecallLog {
  id: string;
  query: string;
  scope?: NMScope | null;
  duration_ms: number;
  top_k?: number | null;
  created_at?: string | null;
  results_count?: number | null;
}

/* -------- 转换函数 -------- */

// 后端 lifecycle kind → 前端语义分类。
// 注意：'事实记忆' 已移除（真实后端不存在该分类）。'active' 默认归入 '语义记忆'。
const KIND_TO_CATEGORY: Record<string, MemoryCategory> = {
  active: '语义记忆',
  archived: '语义记忆',
  stale: '情景记忆',
};

const SEMANTIC_TO_CATEGORY: Record<string, MemoryCategory> = {
  语义记忆: '语义记忆',
  画像规则: '画像规则',
  情景记忆: '情景记忆',
};

/** 把 ISO 时间格式化为 'YYYY-MM-DD HH:mm'（与 mock 格式一致）。 */
export function formatCreatedAt(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 把 NovaMem RecallResult 转换为前端 MemoryRecord。
 * - 字段缺失时 tolerate-and-fill，不抛异常；console.warn 记录。
 */
export function recallToMemoryRecord(
  r: NMRecallResult,
  tenantDisplayName: string,
): MemoryRecord {
  const mem = r.memory;
  const scoring = r.scoring ?? {};

  const category: MemoryCategory =
    (mem.semantic_category && SEMANTIC_TO_CATEGORY[mem.semantic_category]) ||
    KIND_TO_CATEGORY[mem.kind ?? ''] ||
    '语义记忆';

  const fullContent = mem.content ?? '';

  return {
    id: mem.id,
    userId: mem.scope?.user_id ?? 'unknown',
    sessionId: mem.scope?.session_id ?? 'unknown',
    agentId: mem.scope?.agent_id ?? 'unknown',
    tenant: tenantDisplayName,
    category,
    summary: truncate(fullContent, 200),
    rawContent: fullContent,
    tags: mem.tags ?? [],
    triggers: scoring.signals ?? [],
    ttlHours: mem.ttl_seconds != null ? Math.round(mem.ttl_seconds / 3600) : 0,
    createdAt: formatCreatedAt(mem.created_at),
    confidence: clamp01(scoring.relevance ?? 0),
  };
}

/** RecallLog → 前端 TraceSummary。 */
export interface TraceSummary {
  traceId: string;
  intent: string;
  totalMs: number;
  status: 'ok' | 'warn' | 'error';
  startedAt: string;
  agentId: string;
}

export function recallLogToTraceSummary(log: NMRecallLog): TraceSummary {
  const status: TraceSummary['status'] =
    log.duration_ms > 200 ? 'warn' : log.duration_ms > 500 ? 'error' : 'ok';
  return {
    traceId: log.id,
    intent: classifyIntent(log.query),
    totalMs: log.duration_ms,
    status,
    startedAt: log.created_at ?? new Date().toISOString(),
    agentId: log.scope?.agent_id ?? 'unknown',
  };
}

/**
 * RecallLog → 前端 TraceSpan[]。
 * 后端只有「单次 recall 总耗时」，前端期望多个 Span。
 * BFF 合理拆分：把总耗时按经验比例分配到几个虚拟模块，便于前端瀑布流展示。
 * 真实分布需要后端做 OpenTelemetry 后才能精确还原。
 */
export function recallLogToSpans(log: NMRecallLog): TraceSpan[] {
  const total = log.duration_ms;
  // 经验比例（NovaMem 实际处理流程的近似）
  const gateway = Math.round(total * 0.05);
  const intentClassify = Math.round(total * 0.1);
  const vectorRecall = Math.round(total * 0.55);
  const rerank = Math.round(total * 0.2);
  const respond = total - gateway - intentClassify - vectorRecall - rerank;

  let cursor = 0;
  const push = (
    module: string,
    operation: string,
    durationMs: number,
    status: TraceSpan['status'] = 'ok',
    detail?: Record<string, unknown>,
  ): TraceSpan => {
    const span = { module, operation, durationMs, start: cursor, status, detail };
    cursor += durationMs;
    return span;
  };

  return [
    push('BFF · Next.js', 'Route Handler 入口路由', gateway, 'ok', {
      traceId: log.id,
      origin: 'BFF',
    }),
    push('NovaMem · FastAPI', '意图分类 / scope 校验', intentClassify, 'ok', {
      scope: log.scope,
    }),
    push('Milvus Lite', `向量 ANN 检索 (TopK=${log.top_k ?? 8})`, vectorRecall, 'ok', {
      query: log.query,
      top_k: log.top_k,
    }),
    push('NovaMem · Ranker', '三因子评分 (relevance 0.5 + recency 0.25 + importance 0.25)', rerank, 'ok', {
      results_count: log.results_count,
    }),
    push('BFF · Next.js', '响应转换 + Header 回灌', Math.max(respond, 1), 'ok'),
  ];
}

/* -------- utils -------- */

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

const INTENT_PATTERNS: { pat: RegExp; label: string }[] = [
  { pat: /(推荐|介绍|什么好|有什么)/, label: 'recommend' },
  { pat: /(\?|？)/, label: 'ask' },
  { pat: /(搜索|查找|找一下)/, label: 'search' },
];

function classifyIntent(q: string): string {
  for (const { pat, label } of INTENT_PATTERNS) {
    if (pat.test(q)) return label;
  }
  return 'ask';
}
