import { API_BASE_URL, DEFAULT_TENANT } from './config';

export class ApiError extends Error {
  readonly status: number;
  readonly payload?: unknown;
  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function genTraceId(): string {
  return `tr_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
}

/** 浏览器侧：把 traceId 落地到 sessionStorage 以便链路追踪页面展示。 */
function recordTrace(traceId: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem('hm-last-trace-id', traceId);
  } catch {}
}

export interface FetchOptions extends RequestInit {
  /** 是否随请求注入 X-Trace-Id。默认 true。 */
  trace?: boolean;
  /** 显式指定 traceId，便于关联前后端日志。默认自动生成。 */
  traceId?: string;
  /** 覆盖租户。默认使用 NEXT_PUBLIC_TENANT。 */
  tenant?: string;
}

export async function fetcher<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { trace = true, traceId, tenant, headers, ...rest } = options;

  const h = new Headers(headers);
  if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
  if (!h.has('Accept')) h.set('Accept', 'application/json');
  h.set('X-Tenant-Id', tenant ?? DEFAULT_TENANT);
  if (trace) {
    const id = traceId ?? genTraceId();
    h.set('X-Trace-Id', id);
    recordTrace(id);
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, { ...rest, headers: h, credentials: 'include' });

  if (!res.ok) {
    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      payload = await res.text().catch(() => undefined);
    }
    throw new ApiError(
      `${res.status} ${res.statusText} · ${path}`,
      res.status,
      payload,
    );
  }
  // 204 No Content 等无 body 场景
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** SWR fetcher 适配 — SWR key 可以是字符串或 [url, init] 元组。 */
export const swrFetcher = <T = unknown>(key: string | [string, FetchOptions]) =>
  Array.isArray(key) ? fetcher<T>(key[0], key[1]) : fetcher<T>(key);
