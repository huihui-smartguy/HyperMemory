'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface MegaItem {
  href: string;
  title: string;
  oneLiner: string;
  glyph: string;
}

interface MegaGroup {
  key: string;
  label: string;
  href?: string;
  items?: MegaItem[];
}

const NAV: MegaGroup[] = [
  {
    key: 'basic',
    label: '基础面板',
    items: [
      {
        href: '/basic/vault',
        title: '记忆金库',
        oneLiner: '高密度数据网格 · Spotlight 搜索 · 实体胶囊。',
        glyph: '◍',
      },
      {
        href: '/basic/analytics',
        title: '运行大盘',
        oneLiner: 'API 吞吐 · 网关延迟 · 节点健康度。',
        glyph: '◐',
      },
    ],
  },
  {
    key: 'advanced',
    label: '进阶面板',
    items: [
      {
        href: '/advanced/evolution',
        title: 'Schema 进化车间',
        oneLiner: '辩证推理流 · Diff 视窗 · 人机协同审批。',
        glyph: '◇',
      },
      {
        href: '/advanced/cognitive-graph',
        title: '认知拓扑引擎',
        oneLiner: '记忆全生命周期管道 · 因果图谱编辑。',
        glyph: '◈',
      },
      {
        href: '/advanced/retrieval-xray',
        title: '召回 X 光机',
        oneLiner: '单次请求溯源 · 瀑布流 · 重排得分。',
        glyph: '◉',
      },
    ],
  },
  { key: 'dev', label: '开发者中心', href: '/dev' },
];

export function MegaMenu() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const pathname = usePathname();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 路由切换自动收起
  useEffect(() => setOpenKey(null), [pathname]);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenKey(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const activeGroup = NAV.find((g) => g.key === openKey);

  const toggleTheme = () => {
    const next = document.documentElement.classList.toggle('dark') ? 'dark' : 'light';
    window.localStorage.setItem('hm-theme', next);
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-50"
      onMouseLeave={scheduleClose}
    >
      <div className="hm-glass border-b">
        <nav className="mx-auto max-w-7xl h-14 px-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[15px] font-semibold tracking-apple"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-accent" />
            HyperMemory
          </Link>

          <ul className="flex items-center gap-1">
            {NAV.map((g) => {
              const isOpen = openKey === g.key;
              if (g.href) {
                return (
                  <li key={g.key}>
                    <Link
                      href={g.href}
                      className={`px-3.5 h-9 inline-flex items-center rounded-full text-[13px] font-medium transition-colors ${
                        pathname?.startsWith(g.href)
                          ? 'text-ink-primary dark:text-ink-inverse bg-black/[0.04] dark:bg-white/[0.06]'
                          : 'hm-subtle hover:text-ink-primary dark:hover:text-ink-inverse'
                      }`}
                    >
                      {g.label}
                    </Link>
                  </li>
                );
              }
              return (
                <li
                  key={g.key}
                  onMouseEnter={() => {
                    cancelClose();
                    setOpenKey(g.key);
                  }}
                >
                  <button
                    className={`px-3.5 h-9 inline-flex items-center gap-1 rounded-full text-[13px] font-medium transition-colors ${
                      isOpen
                        ? 'text-ink-primary dark:text-ink-inverse bg-black/[0.04] dark:bg-white/[0.06]'
                        : 'hm-subtle hover:text-ink-primary dark:hover:text-ink-inverse'
                    }`}
                  >
                    {g.label}
                    <span
                      className={`text-[10px] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-full hm-subtle hover:text-ink-primary dark:hover:text-ink-inverse hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              aria-label="切换主题"
              title="切换浅色 / 深色"
            >
              ◐
            </button>
            <Link href="/dev" className="hm-btn-ghost h-9">
              控制台
            </Link>
          </div>
        </nav>
      </div>

      {/* 二级毛玻璃面板 */}
      <AnimatePresence>
        {activeGroup?.items && (
          <motion.div
            key={activeGroup.key}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="border-b hm-glass shadow-mega"
          >
            <div className="mx-auto max-w-7xl px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {activeGroup.items.map((item) => (
                <Link
                  href={item.href}
                  key={item.href}
                  className="group block rounded-2xl p-5 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-mute text-accent flex items-center justify-center text-lg">
                      {item.glyph}
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold tracking-apple group-hover:text-accent transition-colors">
                        {item.title}
                      </div>
                      <p className="mt-1 text-[13px] hm-subtle leading-relaxed">
                        {item.oneLiner}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
