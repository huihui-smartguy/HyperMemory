import type { Metadata, Viewport } from 'next';
import './globals.css';
import { MegaMenu } from '@/components/nav/MegaMenu';
import { ThemeBoot } from '@/components/nav/ThemeBoot';

export const metadata: Metadata = {
  title: 'NovaMem · 企业级记忆系统',
  description:
    'NovaMem 是面向大模型 Agent 的企业级元认知记忆中枢，提供原始记忆摄入、结构化记忆建模、自适应多路召回与 Schema 自主进化能力。',
};

// 在 hydration 之前同步应用主题，避免「浅色用户首屏看到一瞬深色」的 FOUC。
const themeBootstrap = `
(function() {
  try {
    var stored = localStorage.getItem('hm-theme');
    var dark = stored ? stored === 'dark' : true;
    document.documentElement.classList.toggle('dark', dark);
  } catch (_) {}
})();
`;

export const viewport: Viewport = {
  // 显式设置 viewport，确保跨平台（macOS / Windows / iOS / Android）缩放一致
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F5F7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      {/*
        flex flex-col min-h-screen：实现 Sticky Footer 模式。
        main 设为 flex-1，撑满剩余高度，footer 始终贴底。
        同时解决 Windows Chrome 下因内容较短导致 footer 浮于页面中央、
        底部留白过多的跨平台比例问题。
      */}
      <body className="flex flex-col min-h-screen bg-canvas dark:bg-canvas-dark text-ink-primary dark:text-ink-inverse font-sans antialiased">
        <ThemeBoot />
        <MegaMenu />
        <main className="flex-1 pt-14">{children}</main>
        <footer className="mt-24 border-t hm-hairline">
          <div className="mx-auto max-w-7xl px-6 py-10 text-xs hm-subtle">
            NovaMem © {new Date().getFullYear()} · 企业级智能体元认知记忆中枢
          </div>
        </footer>
      </body>
    </html>
  );
}
