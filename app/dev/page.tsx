import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { PageHeader } from '@/components/ui/PageHeader';

const API_CONTRACTS = [
  {
    method: 'GET',
    path: '/api/v1/memory/vault',
    layer: 'Go · Gateway',
    protocol: 'REST',
    purpose: '记忆金库分页查询',
  },
  {
    method: 'GET',
    path: '/api/v1/analytics/throughput',
    layer: 'Go · Gateway',
    protocol: 'REST',
    purpose: '运行大盘吞吐时序',
  },
  {
    method: 'GET',
    path: '/api/v1/schema/tree',
    layer: 'Go · Gateway',
    protocol: 'REST',
    purpose: '当前激活 Schema 认知树',
  },
  {
    method: 'POST',
    path: '/api/v1/schema/accept',
    layer: 'Go · Gateway → Python',
    protocol: 'REST',
    purpose: 'Schema Draft 审批落盘',
  },
  {
    method: 'GET',
    path: '/api/v1/evolution/stream',
    layer: 'Python (Go 反代)',
    protocol: 'SSE',
    purpose: '辩证推理过程推流',
  },
  {
    method: 'GET',
    path: '/api/v1/trace/:traceId',
    layer: 'Go · Gateway',
    protocol: 'REST',
    purpose: '召回 X 光机 Span 聚合',
  },
];

const SSE_EVENTS = [
  { event: 'surprise_alert', desc: '高惊喜度阈值触发，附带触发样本指针。' },
  { event: 'reasoning_chunk', desc: 'LLM 推理过程的增量字符流，前端打字机渲染。' },
  { event: 'schema_diff', desc: '推理终态，下发 old/new Markdown + status。' },
];

export const metadata = { title: '开发者中心 · HyperMemory' };

export default function DevCenterPage() {
  return (
    <>
      <PageHeader
        eyebrow="工程入口"
        title="开发者中心"
        description="租户上下文、TraceID、API 契约、SSE 事件协议与降级策略 — 工程师对接 HyperMemory 的全部入口。"
      />

      <div className="mx-auto max-w-7xl px-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="当前租户上下文" subtitle="Zustand 全局状态">
            <dl className="space-y-3 text-[13px]">
              <Kv k="Tenant" v="理财部 · Wealth-01" />
              <Kv k="Agent ID" v="agent-101" mono />
              <Kv k="Trace ID" v="tr_6b21f9_e7a44c1d" mono />
              <Kv k="主题模式" v="Light / Dark · 跟随系统" />
            </dl>
          </Card>
          <Card title="技术栈" subtitle="文档对齐的核心选型">
            <ul className="space-y-2 text-[13px]">
              <li>• Next.js 14 App Router + TypeScript</li>
              <li>• TailwindCSS + Framer Motion (Mega Menu)</li>
              <li>• Zustand · 全局状态</li>
              <li>• Monaco Editor · Diff 视窗</li>
              <li>• ECharts · 链路 / 大盘</li>
              <li>• Antd · 高定极简表格 (按需)</li>
              <li>• @antv/g6 · 图谱预留位</li>
            </ul>
          </Card>
          <Card title="非功能性约束" subtitle="渲染 / 状态 / 降级">
            <ul className="space-y-2 text-[13px]">
              <li>· 图谱 &gt; 5000 节点：自动聚合簇模式</li>
              <li>· SSE 中断：回退 REST 长轮询</li>
              <li>· 暗黑 / 浅色：localStorage + 系统跟随</li>
              <li>· 首屏：RSC 预渲染保证极速 TTFB</li>
            </ul>
          </Card>
        </div>

        <Card title="API 契约总览" subtitle="REST 标准 + SSE 流式分流">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11.5px] uppercase tracking-[0.16em] hm-subtle border-b hm-hairline">
                  <th className="py-3 pr-4">方法</th>
                  <th className="py-3 pr-4">路径</th>
                  <th className="py-3 pr-4">服务层</th>
                  <th className="py-3 pr-4">协议</th>
                  <th className="py-3">用途</th>
                </tr>
              </thead>
              <tbody className="divide-y hm-hairline">
                {API_CONTRACTS.map((c) => (
                  <tr key={c.path}>
                    <td className="py-3 pr-4">
                      <Chip variant={c.method === 'POST' ? 'accent' : 'success'}>{c.method}</Chip>
                    </td>
                    <td className="py-3 pr-4 font-mono">{c.path}</td>
                    <td className="py-3 pr-4 hm-subtle">{c.layer}</td>
                    <td className="py-3 pr-4">
                      <Chip variant={c.protocol === 'SSE' ? 'warn' : 'default'}>{c.protocol}</Chip>
                    </td>
                    <td className="py-3">{c.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="SSE 事件协议 · Schema 进化车间" subtitle="event: <name> + JSON data">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SSE_EVENTS.map((e) => (
              <div key={e.event} className="border hm-hairline rounded-2xl p-4">
                <div className="font-mono text-[13px] text-accent">event: {e.event}</div>
                <p className="mt-2 hm-subtle text-[12.5px] leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
          <pre className="mt-5 font-mono text-[12px] leading-relaxed bg-black/[0.04] dark:bg-white/[0.05] rounded-xl p-4 overflow-x-auto">
{`event: schema_diff
data: {
  "old_schema": "### 规则约束 ...",
  "new_schema": "### 规则约束 ... [新增 TPO 干预规则]",
  "status": "AWAITING_APPROVAL"
}`}
          </pre>
        </Card>
      </div>
    </>
  );
}

function Kv({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[11.5px] uppercase tracking-[0.16em] hm-subtle">{k}</span>
      <span className={`text-right ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  );
}
