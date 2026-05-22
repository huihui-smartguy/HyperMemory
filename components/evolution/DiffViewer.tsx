'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.DiffEditor),
  { ssr: false, loading: () => <DiffSkeleton /> },
);

interface Props {
  original: string;
  modified: string;
  height?: number;
}

export function DiffViewer({ original, modified, height = 480 }: Props) {
  const [theme, setTheme] = useState<'vs' | 'vs-dark'>('vs');

  useEffect(() => {
    const sync = () =>
      setTheme(document.documentElement.classList.contains('dark') ? 'vs-dark' : 'vs');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border hm-hairline" style={{ height }}>
      <DiffEditor
        original={original}
        modified={modified}
        language="markdown"
        theme={theme}
        options={{
          renderSideBySide: true,
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace',
          wordWrap: 'on',
          renderLineHighlight: 'none',
          guides: { indentation: false },
          padding: { top: 16, bottom: 16 },
        }}
      />
    </div>
  );
}

function DiffSkeleton() {
  return (
    <div className="h-full grid place-items-center text-[12px] hm-subtle">
      正在加载 Monaco Diff 引擎…
    </div>
  );
}
