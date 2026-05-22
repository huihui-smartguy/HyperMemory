'use client';

import { useEffect } from 'react';

export function ThemeBoot() {
  useEffect(() => {
    // 默认深色主题；用户手动切换后存入 localStorage 持久化。
    const stored = window.localStorage.getItem('hm-theme');
    const dark = stored ? stored === 'dark' : true;
    document.documentElement.classList.toggle('dark', dark);
  }, []);
  return null;
}
