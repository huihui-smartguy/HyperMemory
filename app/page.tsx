import Link from 'next/link';

const FEATURES = [
  {
    eyebrow: '稳态业务区',
    title: '记忆金库',
    desc: '在沉浸式数据网格中，结构化呈现原始 raw.md 与格式化结果，配合 Spotlight 搜索与实体胶囊，轻盈完成大规模检索与下钻。',
    href: '/basic/vault',
    accent: '◍',
  },
  {
    eyebrow: '稳态业务区',
    title: '运行大盘',
    desc: '吞吐、延迟、记忆分类与节点健康度。以折线、饼图与极简卡片承载关键 SLI，剔除一切冗余。',
    href: '/basic/analytics',
    accent: '◐',
  },
  {
    eyebrow: '敏态进化区',
    title: 'Schema 进化车间',
    desc: '辩证推理过程以 SSE 打字机流式呈现，Monaco Diff 还原 Schema 升级提案，一键完成人机协同审批。',
    href: '/advanced/evolution',
    accent: '◇',
  },
  {
    eyebrow: '敏态进化区',
    title: '认知拓扑引擎',
    desc: '从摄入到图谱编译的全生命周期管道，叠加可拖拽的因果图谱与虚线高亮的反事实提取链路。',
    href: '/advanced/cognitive-graph',
    accent: '◈',
  },
  {
    eyebrow: '敏态进化区',
    title: '召回 X 光机',
    desc: '为每一次 Agent 请求绘制全链路瀑布流，重排序得分与去重拦截一目了然，Bad Case 不再黑盒。',
    href: '/advanced/retrieval-xray',
    accent: '◉',
  },
  {
    eyebrow: '运维工程',
    title: '开发者中心',
    desc: '租户上下文、TraceID、API 契约、SSE 事件协议与降级策略，工程师入口。',
    href: '/dev',
    accent: '⌘',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-24 pb-32 animate-rise">
        <div className="text-[12px] font-medium tracking-[0.2em] uppercase text-accent">
          Enterprise Memory · TPO + DPO Dual Engine
        </div>
        <h1 className="mt-5 text-[64px] md:text-[88px] font-semibold leading-[0.98] tracking-apple">
          让 Agent 的<br />
          自主进化<span className="text-accent">看得见</span>。
        </h1>
        <p className="mt-8 max-w-2xl text-[20px] md:text-[22px] leading-relaxed hm-subtle font-light">
          HyperMemory 是面向大模型智能体的企业级元认知中枢。
          搜推问一体化、TPO 推理期偏好优化、Schema 自主进化 —— 全部以极简白盒方式呈现。
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/basic/vault" className="hm-btn">
            进入记忆金库
          </Link>
          <Link href="/advanced/evolution" className="hm-btn-ghost">
            体验 Schema 进化车间 →
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            ['12,418', '今日 QPS 峰值'],
            ['63 ms', 'Go 网关 P99'],
            ['241', '在线 Schema'],
            ['99.98%', '可用性 SLA'],
          ].map(([v, k]) => (
            <div key={k} className="border-l hm-hairline pl-5">
              <div className="text-[28px] font-semibold tracking-apple">{v}</div>
              <div className="mt-1 text-[12.5px] hm-subtle">{k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="border-t hm-hairline">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="text-[36px] font-semibold tracking-apple">六大核心面板</h2>
          <p className="mt-3 max-w-xl hm-subtle font-light">
            从稳态业务到敏态进化，每一个模块都是底层认知能力的白盒投影。
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="group hm-card p-7 transition-all hover:shadow-floating hover:-translate-y-0.5"
              >
                <div className="text-[12px] font-medium tracking-[0.2em] uppercase text-accent">
                  {f.eyebrow}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-accent-mute text-accent flex items-center justify-center">
                    {f.accent}
                  </span>
                  <h3 className="text-[20px] font-semibold tracking-apple group-hover:text-accent transition-colors">
                    {f.title}
                  </h3>
                </div>
                <p className="mt-4 hm-subtle leading-relaxed text-[14.5px] font-light">
                  {f.desc}
                </p>
                <div className="mt-6 text-[13px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                  进入 →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
