'use client';

import { useEffect } from 'react';

export function ThemeBoot() {
  useEffect(() => {
    const stored = window.localStorage.getItem('hm-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
  }, []);
  return null;
}
