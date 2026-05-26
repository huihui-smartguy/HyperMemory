// 模块开关 · 客户端 + 服务端共用。
// 通过 NEXT_PUBLIC_ENABLED_MODULES（逗号分隔）控制顶部导航 / 主页模块网格 / 路由 redirect。
//
// 可选 key：vault, analytics, evolution, cognitive-graph, retrieval-xray, dev
// 默认全部启用；生产模式（docker-compose.prod.yml）默认设为 "vault,dev"。
//
// 注意：这是构建期变量（NEXT_PUBLIC_ 前缀），修改后需要重新 build。

export const ALL_MODULE_KEYS = [
  'vault',
  'analytics',
  'evolution',
  'cognitive-graph',
  'retrieval-xray',
  'dev',
] as const;

export type ModuleKey = (typeof ALL_MODULE_KEYS)[number];

const RAW =
  process.env.NEXT_PUBLIC_ENABLED_MODULES ??
  'vault,analytics,evolution,cognitive-graph,retrieval-xray,dev';

export const ENABLED_MODULES = new Set(
  RAW.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

/** 记忆金库永远启用（生产模式核心功能）。 */
ENABLED_MODULES.add('vault');

export function isModuleEnabled(key: string): boolean {
  return ENABLED_MODULES.has(key);
}
