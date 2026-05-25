// Route Handler 通用工具：响应头注入、数据源标记。
import 'server-only';
import { NextRequest } from 'next/server';

export type DataSourceTag = 'real' | 'mock' | 'hybrid';

export interface ResponseMeta {
  source: DataSourceTag;
  mockFields?: string[];
  mockReason?: string;
  traceId?: string;
}

/** 把入站请求的 X-Trace-Id 取出来，没有则生成一个，便于回灌响应 Header。 */
export function getTraceId(req: NextRequest): string {
  const incoming = req.headers.get('X-Trace-Id');
  if (incoming) return incoming;
  return `tr_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
}

export function jsonResponse<T>(body: T, meta: ResponseMeta, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Data-Source', meta.source);
  if (meta.source === 'mock' || meta.source === 'hybrid') {
    headers.set('X-Mock-Data', 'true');
  }
  if (meta.mockFields?.length) {
    headers.set('X-Mock-Fields', meta.mockFields.join(','));
  }
  if (meta.mockReason) headers.set('X-Mock-Reason', meta.mockReason);
  if (meta.traceId) headers.set('X-Trace-Id', meta.traceId);
  return new Response(JSON.stringify(body), { ...init, headers });
}

/** 统一错误响应。 */
export function errorResponse(status: number, message: string, traceId?: string): Response {
  return jsonResponse({ error: message }, { source: 'real', traceId }, { status });
}
