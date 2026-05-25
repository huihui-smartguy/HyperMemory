// 租户名映射 · 前端中文展示名 → 后端 scope.user_id 形态。
// 短期 hard-code；后期可替换为后端 GET /v1/admin/tenants 字典。
import 'server-only';

const TENANT_TO_USER_ID: Record<string, string> = {
  '理财部 · Wealth-01': 'wealth-01',
  'Wealth-01': 'wealth-01',
  '信贷部 · Credit-02': 'credit-02',
  'Credit-02': 'credit-02',
  '研究院 · Lab-A': 'lab-a',
  'Lab-A': 'lab-a',
};

// 反向映射 · 选择带中文前缀的显示名作为权威表示，避免被简写覆盖
const USER_ID_TO_TENANT: Record<string, string> = {
  'wealth-01': '理财部 · Wealth-01',
  'credit-02': '信贷部 · Credit-02',
  'lab-a': '研究院 · Lab-A',
};

/** 把前端注入的 X-Tenant-Id 映射为后端期望的 scope.user_id。 */
export function tenantToUserId(tenant: string | null | undefined): string {
  if (!tenant) return 'wealth-01';
  return TENANT_TO_USER_ID[tenant] ?? slugify(tenant);
}

/** 把后端 user_id 反向映射为前端展示名（用于 BFF 回写 tenant 字段）。 */
export function userIdToTenant(userId: string | null | undefined): string {
  if (!userId) return '理财部 · Wealth-01';
  return USER_ID_TO_TENANT[userId] ?? userId;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s·]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/^-+|-+$/g, '');
}
