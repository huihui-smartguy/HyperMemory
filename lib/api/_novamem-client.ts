// NovaMem 后端调用工具。仅 server runtime 可见。
// - 5s 超时（AbortController）
// - 上游错误归一为 ApiError
// - BFF_USE_MOCK_BACKEND=1 时短路：不发真实 HTTP，直接吐预置 fixture
import 'server-only';

import { BFF_USE_MOCK_BACKEND, NOVAMEM_BASE_URL } from './config';
import { ApiError } from './fetcher';

export interface UpstreamOptions {
  /** 上游 traceId，会写入 X-Trace-Id；不传时不注入。 */
  traceId?: string;
  /** 超时（ms），默认 5000。 */
  timeoutMs?: number;
}

export async function callNovamem<T = unknown>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  opts: UpstreamOptions = {},
): Promise<T> {
  if (BFF_USE_MOCK_BACKEND) {
    return mockUpstream<T>(method, path, body);
  }

  const url = `${NOVAMEM_BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000);
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (opts.traceId) headers['X-Trace-Id'] = opts.traceId;

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      let payload: unknown;
      try {
        payload = await res.json();
      } catch {
        payload = await res.text().catch(() => undefined);
      }
      throw new ApiError(`Upstream ${res.status} · ${path}`, res.status, payload);
    }

    if (res.status === 202 || res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === 'AbortError') {
      throw new ApiError(`Upstream timeout · ${path}`, 504);
    }
    throw new ApiError(`Upstream unreachable · ${path}`, 502, { cause: (e as Error).message });
  } finally {
    clearTimeout(timer);
  }
}

/** BFF_USE_MOCK_BACKEND=1 时的预置 fixture。 */
function mockUpstream<T>(method: string, path: string, body: unknown): Promise<T> {
  if (method === 'GET' && path === '/health') {
    return Promise.resolve({
      status: 'ok',
      version: 'mock-0.1',
      milvus_lite_ok: true,
      sqlite_ok: true,
      uptime_s: 1234,
      memory_count: 8,
    } as unknown as T);
  }
  if (method === 'POST' && path === '/v1/recall') {
    const q = (body as { query?: string })?.query ?? '';
    // 把 mock 记忆复用为上游样例 — 用 NovaMem schema 形态包裹一层
    // 与 adapters/novamem.ts 中 RecallResult 形状对齐
    return Promise.resolve({
      results: MOCK_RECALL_FIXTURE.map((r) => ({
        ...r,
        scoring: { ...r.scoring, query: q },
      })),
    } as unknown as T);
  }
  if (method === 'POST' && path === '/v1/memories') {
    return Promise.resolve(undefined as T);
  }
  if (method === 'GET' && path.startsWith('/v1/admin/recall-logs')) {
    return Promise.resolve({ items: MOCK_RECALL_LOGS } as unknown as T);
  }
  throw new ApiError(`Mock upstream has no fixture for ${method} ${path}`, 501);
}

// 与 adapters/novamem.ts 的输入类型保持一致。
const MOCK_RECALL_FIXTURE = [
  {
    memory: {
      id: 'nm_8f02a1',
      scope: { user_id: 'wealth-01', session_id: 'sess_2026-05-22-0091', agent_id: 'agent-101' },
      kind: 'active',
      content: '用户在过去 14 天内连续 3 次拒绝高风险股票基金推荐，倾向避险。',
      tags: ['偏好漂移', '避险', '高净值'],
      ttl_seconds: 720 * 3600,
      created_at: '2026-05-21T17:42:00Z',
    },
    scoring: { relevance: 0.92, recency: 0.81, importance: 0.7, signals: ['拒绝高风险资产', '隐私条款敏感'] },
  },
  {
    memory: {
      id: 'nm_9c41bd',
      scope: { user_id: 'wealth-01', session_id: 'sess_2026-05-22-0117', agent_id: 'agent-101' },
      kind: 'active',
      content: '用户年龄 35，净资产 ¥620 万，注册渠道为线下贵宾室。',
      tags: ['静态画像'],
      ttl_seconds: 8760 * 3600,
      created_at: '2026-04-01T09:12:00Z',
    },
    scoring: { relevance: 0.85, recency: 0.5, importance: 0.95, signals: ['KYC 已完成'] },
  },
  {
    memory: {
      id: 'nm_22ff90',
      scope: { user_id: 'wealth-01', session_id: 'sess_2026-05-22-0308', agent_id: 'agent-101' },
      kind: 'stale',
      content: '周末时段对账户体检 SOP 的接受率为 78%，远高于推销类。',
      tags: ['时段', '情景规则', '周末'],
      ttl_seconds: 2160 * 3600,
      created_at: '2026-05-20T22:31:00Z',
    },
    scoring: { relevance: 0.78, recency: 0.65, importance: 0.6, signals: ['时间窗口', '行为模式'] },
  },
];

const MOCK_RECALL_LOGS = [
  {
    id: 'tr_6b21f9_e7a44c1d',
    query: '我最近想买点稳健的理财',
    scope: { user_id: 'wealth-01', agent_id: 'agent-101' },
    duration_ms: 107,
    top_k: 8,
    created_at: '2026-05-22T18:01:23Z',
    results_count: 8,
  },
  {
    id: 'tr_6b21f6_4e90ff12',
    query: '介绍下高收益基金',
    scope: { user_id: 'wealth-01', agent_id: 'agent-101' },
    duration_ms: 138,
    top_k: 8,
    created_at: '2026-05-22T18:00:01Z',
    results_count: 6,
  },
];
