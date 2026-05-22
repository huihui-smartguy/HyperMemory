import { ReactNode } from 'react';

type Variant = 'default' | 'accent' | 'success' | 'warn' | 'danger';

const VARIANT: Record<Variant, string> = {
  default: 'text-ink-secondary bg-black/[0.04] dark:text-white/70 dark:bg-white/[0.06]',
  accent: 'text-accent bg-accent-mute',
  success: 'text-signal-success bg-signal-success/10',
  warn: 'text-signal-warning bg-signal-warning/10',
  danger: 'text-signal-danger bg-signal-danger/10',
};

export function Chip({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 h-6 rounded-full text-[12px] font-medium leading-none ${VARIANT[variant]}`}
    >
      {children}
    </span>
  );
}
