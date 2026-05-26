'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAnalytics } from '@/lib/api/hooks';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { isModuleEnabled } from '@/lib/features';

// ----------------------------------------------------------------
// 模块配置
// ----------------------------------------------------------------
const MODULES = [
  {
    key: 'vault',
    glyph: '◍',
    title: '记忆金库',
    category: '稳态业务',
    desc: '结构化呈现原始记忆与格式化结果，配合 Spotlight 搜索与实体胶囊。',
    href: '/basic/vault',
  },
  {
    key: 'analytics',
    glyph: '◐',
    title: '运行大盘',
    category: '稳态业务',
    desc: '吞吐量、延迟分布、记忆分类与节点健康度的实时可视化看板。',
    href: '/basic/analytics',
  },
  {
    key: 'evolution',
    glyph: '◇',
    title: 'Schema 进化车间',
    category: '敏态进化',
    desc: '辩证推理流 · Monaco Diff 升级提案 · 人机协同审批一体化。',
    href: '/advanced/evolution',
  },
  {
    key: 'cognitive-graph',
    glyph: '◈',
    title: '认知拓扑引擎',
    category: '敏态进化',
    desc: '记忆全生命周期管道可视化，含可拖拽因果图谱与反事实提取链路。',
    href: '/advanced/cognitive-graph',
  },
  {
    key: 'retrieval-xray',
    glyph: '◉',
    title: '召回 X 光机',
    category: '敏态进化',
    desc: '为每次 Agent 请求绘制全链路瀑布流，Bad Case 排查不再黑盒。',
    href: '/advanced/retrieval-xray',
  },
  {
    key: 'dev',
    glyph: '⌘',
    title: '开发者中心',
    category: '运维工程',
    desc: '租户上下文、TraceID、API 契约、SSE 协议与降级策略一览。',
    href: '/dev',
  },
] as const;

// ----------------------------------------------------------------
// 页面
// ----------------------------------------------------------------
export default function HomePage() {
  const { data, isLoading } = useAnalytics();

  // kpi 是 { label, value, delta, positive }[] 数组
  const kpiCards = data?.data?.kpi ?? [];

  // 按 NEXT_PUBLIC_ENABLED_MODULES 过滤
  const visibleModules = useMemo(
    () => MODULES.filter((m) => isModuleEnabled(m.key)),
    [],
  );

  return (
    <div className="mx-auto max-w-7xl px-6 animate-rise">

      {/* ── 顶部标题区 ── */}
      <div className="flex items-start justify-between pt-10 pb-8 border-b hm-hairline">
        <div>
          <h1 className="hm-headline text-[28px] text-ink-primary dark:text-ink-inverse">
            NovaMem
          </h1>
          <p className="mt-1.5 text-[13.5px] hm-subtle">
            企业级智能体元认知记忆系统 · 实时记忆摄入 · 自适应召回 · Schema 自主进化
          </p>
        </div>
        {data && (
          <DataSourceBadge
            source={data.source}
            mockFields={data.mockFields}
            mockReason={data.mockReason}
          />
        )}
      </div>

      {/* ── KPI 状态栏 ── */}
      <div className="py-5 border-b hm-hairline">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 系统状态指示 */}
          <span className="flex items-center gap-1.5 hm-chip">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLoading ? 'bg-ink-tertiary animate-pulse' : 'bg-signal-success'
              }`}
            />
            <span className="text-[12px]">
              {isLoading ? '加载中…' : '系统正常'}
            </span>
          </span>

          {/* KPI 指标芯片 */}
          {kpiCards.length > 0
            ? kpiCards.map((k) => (
                <span key={k.label} className="hm-chip text-[12px] flex items-center gap-1">
                  <span className="hm-subtle">{k.label}</span>
                  <span className="mx-0.5 hm-subtle opacity-30">/</span>
                  <span className="font-medium tabular-nums text-ink-primary dark:text-ink-inverse">
                    {k.value}
                  </span>
                  {k.delta && (
                    <span
                      className={`text-[10px] ml-0.5 ${
                        k.positive ? 'text-signal-success' : 'text-signal-danger'
                      }`}
                    >
                      {k.delta}
                    </span>
                  )}
                </span>
              ))
            : /* 骨架占位 */
              [1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="hm-chip w-32 h-7 animate-pulse bg-black/[0.04] dark:bg-white/[0.04]"
                />
              ))}
        </div>
      </div>

      {/* ── 模块网格 ── */}
      <div className="py-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[12px] font-medium tracking-[0.12em] uppercase hm-subtle">
            功能模块
          </h2>
          <span className="text-[12px] hm-subtle">{visibleModules.length} 个模块</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleModules.map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className="group hm-card p-5 flex flex-col gap-3 transition-all
                         hover:shadow-floating hover:-translate-y-0.5
                         hover:border-accent/20 dark:hover:border-accent/20"
            >
              {/* 图标 + 标题行 */}
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-lg bg-accent-mute text-accent
                              flex items-center justify-center text-[15px] flex-shrink-0"
                >
                  {m.glyph}
                </span>
                <div className="min-w-0">
                  <div
                    className="text-[15px] font-semibold tracking-apple text-ink-primary
                                dark:text-ink-inverse group-hover:text-accent transition-colors truncate"
                  >
                    {m.title}
                  </div>
                  <div className="text-[11px] hm-subtle mt-0.5">{m.category}</div>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-[13px] hm-subtle leading-relaxed font-light flex-1">
                {m.desc}
              </p>

              {/* 进入箭头（hover 显现）*/}
              <div className="flex items-center justify-end">
                <span
                  className="text-[12px] text-accent opacity-0 transition-all
                              group-hover:opacity-100 group-hover:translate-x-0.5"
                >
                  进入 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
