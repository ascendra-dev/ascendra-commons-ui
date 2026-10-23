import type { TenantOption } from '@/ascendra-commons-ui/authorization.ui/queries';

/**
 * The app's tenants, for a platform admin's tenant picker — the app owns its tenants (authorization only sees ids), so
 * a vertical lists or fetches its own here. These are ascendra-commons-sandbox's.
 */
export const ACCESS_TENANTS: TenantOption[] = [
  { id: 'tenant_acme', name: 'Acme' },
  { id: 'tenant_globex', name: 'Globex' },
  { id: 'tenant_meridian', name: 'Meridian' },
];

export const tenantName = (id: string | null | undefined): string =>
  id == null ? 'All tenants' : (ACCESS_TENANTS.find((t) => t.id === id)?.name ?? id);
