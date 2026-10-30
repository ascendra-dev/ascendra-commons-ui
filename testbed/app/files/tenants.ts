import type { TenantOption } from '@/ascendra-commons-ui/file-storage.ui/queries';

/**
 * The app's tenants, for a platform admin's tenant picker and filter — the app owns its tenants (file-storage only
 * sees ids), so a vertical lists or fetches its own here. These are ascendra-commons-sandbox's.
 */
export const FILE_TENANTS: TenantOption[] = [
  { id: 'tenant_acme', name: 'Acme' },
  { id: 'tenant_globex', name: 'Globex' },
  { id: 'tenant_meridian', name: 'Meridian' },
];

/** A tenant's name; every file belongs to one. */
export const tenantName = (id: string | null | undefined): string =>
  id == null ? 'No tenant' : (FILE_TENANTS.find((t) => t.id === id)?.name ?? id);
