import { ReactNode } from 'react';

interface Props {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  padded = true,
}: Props) {
  return (
    <section className={`hm-card overflow-hidden ${className}`}>
      {(title || actions) && (
        <header className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 border-b hm-hairline">
          <div>
            {title && (
              <h2 className="text-[15px] font-semibold tracking-apple">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-1 text-[12.5px] hm-subtle">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
    </section>
  );
}
