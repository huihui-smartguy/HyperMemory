'use client';

import { create } from 'zustand';

interface AppState {
  tenant: string;
  agentId: string;
  traceId: string;
  theme: 'light' | 'dark';
  setTenant: (t: string) => void;
  setAgent: (a: string) => void;
  setTheme: (t: 'light' | 'dark') => void;
  rotateTraceId: () => void;
}

function genTraceId() {
  const ts = Date.now().toString(16);
  const rand = Math.random().toString(16).slice(2, 10);
  return `tr_${ts}_${rand}`;
}

export const useAppStore = create<AppState>((set) => ({
  tenant: '理财部 · Wealth-01',
  agentId: 'agent-101',
  traceId: genTraceId(),
  theme: 'light',
  setTenant: (tenant) => set({ tenant }),
  setAgent: (agentId) => set({ agentId }),
  setTheme: (theme) => set({ theme }),
  rotateTraceId: () => set({ traceId: genTraceId() }),
}));
