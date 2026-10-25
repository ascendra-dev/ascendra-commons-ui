import type { TenantOption } from '@/ascendra-commons-ui/notification.ui/queries';

/**
 * The app's tenants, for a platform admin's tenant picker and filter — the app owns its tenants (notification only
 * sees ids), so a vertical lists or fetches its own here. These are ascendra-commons-sandbox's.
 */
export const NOTIFICATION_TENANTS: TenantOption[] = [
  { id: 'tenant_acme', name: 'Acme' },
  { id: 'tenant_globex', name: 'Globex' },
  { id: 'tenant_meridian', name: 'Meridian' },
];

/** A tenant's name; a tenantless send (platform staff's) has none. */
export const tenantName = (id: string | null | undefined): string =>
  id == null ? 'No tenant' : (NOTIFICATION_TENANTS.find((t) => t.id === id)?.name ?? id);
