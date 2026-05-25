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

function recordTrace(traceId: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem('hm-last-trace-id', traceId);
  } catch {}
}

export interface FetchOptions extends RequestInit {
  trace?: boolean;
  traceId?: string;
  tenant?: string;
}

/** 数据源标识（从 BFF 响应 Header 解析）。 */
export type DataSourceTag = 'real' | 'mock' | 'hybrid';

export interface ApiEnvelope<T> {
  data: T;
  source: DataSourceTag;
  /** hybrid 模式下，哪些字段是 mock 兜底（来自 X-Mock-Fields） */
  mockFields?: string[];
  /** 该 mock 的兜底原因（来自 X-Mock-Reason） */
  mockReason?: string;
  traceId?: string;
}

function buildHeaders(options: FetchOptions): { headers: Headers; traceId: string } {
  const { trace = true, traceId, tenant, headers } = options;
  const h = new Headers(headers);
  if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
  if (!h.has('Accept')) h.set('Accept', 'application/json');
  h.set('X-Tenant-Id', tenant ?? DEFAULT_TENANT);
  const id = trace ? traceId ?? genTraceId() : '';
  if (id) {
    h.set('X-Trace-Id', id);
    recordTrace(id);
  }
  return { headers: h, traceId: id };
}

async function doFetch(path: string, options: FetchOptions): Promise<Response> {
  const { headers } = buildHeaders(options);
  const { trace: _, traceId: __, tenant: ___, headers: ____, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  return fetch(url, { ...rest, headers, credentials: 'include' });
}

async function parseError(res: Response, path: string): Promise<ApiError> {
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = await res.text().catch(() => undefined);
  }
  return new ApiError(`${res.status} ${res.statusText} · ${path}`, res.status, payload);
}

export async function fetcher<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const res = await doFetch(path, options);
  if (!res.ok) throw await parseError(res, path);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** 同 fetcher 但保留响应元信息（数据源标识等），供 UI Badge 使用。 */
export async function fetcherWithMeta<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiEnvelope<T>> {
  const res = await doFetch(path, options);
  if (!res.ok) throw await parseError(res, path);
  const data = res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  const source = (res.headers.get('X-Data-Source') as DataSourceTag) || 'real';
  const mockFieldsHeader = res.headers.get('X-Mock-Fields');
  const mockFields = mockFieldsHeader ? mockFieldsHeader.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  const mockReason = res.headers.get('X-Mock-Reason') || undefined;
  const traceId = res.headers.get('X-Trace-Id') || undefined;
  return { data, source, mockFields, mockReason, traceId };
}

export const swrFetcher = <T = unknown>(key: string | [string, FetchOptions]) =>
  Array.isArray(key) ? fetcher<T>(key[0], key[1]) : fetcher<T>(key);

export const swrFetcherWithMeta = <T = unknown>(key: string | [string, FetchOptions]) =>
  Array.isArray(key) ? fetcherWithMeta<T>(key[0], key[1]) : fetcherWithMeta<T>(key);
