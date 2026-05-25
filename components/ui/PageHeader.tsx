import { ReactNode } from 'react';
import { DataSourceBadge } from './DataSourceBadge';
import type { DataSourceTag } from '@/lib/api/fetcher';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /** 当前页主数据源标识；不传时仅根据全局 DATA_MODE 显示。 */
  dataSource?: DataSourceTag;
  mockFields?: string[];
  mockReason?: string;
}

export function PageHeader({ eyebrow, title, description, actions, dataSource, mockFields, mockReason }: Props) {
  return (
    <header className="mx-auto max-w-7xl px-6 pt-16 pb-10 animate-rise">
      <div className="flex items-end justify-between gap-8 flex-wrap">
        <div>
          {eyebrow && (
            <div className="text-[12px] font-medium tracking-[0.2em] uppercase text-accent">
              {eyebrow}
            </div>
          )}
          <h1 className="mt-3 text-[44px] leading-[1.05] font-semibold tracking-apple">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-[17px] leading-relaxed hm-subtle font-light">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <DataSourceBadge source={dataSource} mockFields={mockFields} mockReason={mockReason} />
          {actions}
        </div>
      </div>
    </header>
  );
}
