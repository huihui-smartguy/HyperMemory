// Next.js 中间件 · 根据 NEXT_PUBLIC_ENABLED_MODULES 把禁用模块的路由 308 重定向到 /basic/vault。
// 与 lib/features.ts 的开关清单保持一致。
import { NextResponse, type NextRequest } from 'next/server';

const ROUTE_TO_MODULE: Record<string, string> = {
  '/basic/analytics': 'analytics',
  '/advanced/evolution': 'evolution',
  '/advanced/cognitive-graph': 'cognitive-graph',
  '/advanced/retrieval-xray': 'retrieval-xray',
  '/dev': 'dev',
};

const RAW =
  process.env.NEXT_PUBLIC_ENABLED_MODULES ??
  'vault,analytics,evolution,cognitive-graph,retrieval-xray,dev';

const ENABLED = new Set(
  RAW.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);
ENABLED.add('vault'); // vault 始终启用

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  for (const [route, mod] of Object.entries(ROUTE_TO_MODULE)) {
    // 精确匹配或子路径都拦截（如 /dev 与 /dev/anything）
    if ((path === route || path.startsWith(route + '/')) && !ENABLED.has(mod)) {
      const url = req.nextUrl.clone();
      url.pathname = '/basic/vault';
      url.search = '';
      return NextResponse.redirect(url, 308);
    }
  }
  return NextResponse.next();
}

export const config = {
  // 不拦截 /api/*、_next、静态资源
  matcher: ['/basic/:path*', '/advanced/:path*', '/dev/:path*'],
};
