'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ascendra-ui';
import { useSession } from '../observability/auth/use-session';
import { ACCESS_TENANTS } from './tenants';

interface AccessScope {
  /** Holds `authz.platform` — works across tenants. */
  platform: boolean;
  /** The tenant a platform admin is looking at (`undefined` = all); always the viewer's own for anyone else. */
  tenantId: string | undefined;
  setTenantId: (id: string | undefined) => void;
  /** The viewer's own tenant. */
  ownTenantId: string | null;
  actorId: string | null;
  can: (action: string) => boolean;
  ready: boolean;
}

const AccessScopeContext = createContext<AccessScope | null>(null);

/** Who's looking, and at which tenant — the console's one piece of shared state. Lives in the layout, so it survives
 *  moving between screens. */
export function AccessScopeProvider({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = useSession();
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const allowed = session?.allowedActions ?? [];
  const platform = allowed.includes('authz.platform');
  const ownTenantId = session?.actor?.tenantId ?? null;
  const value: AccessScope = {
    platform,
    tenantId: platform ? picked : (ownTenantId ?? undefined),
    setTenantId: setPicked,
    ownTenantId,
    actorId: session?.actor?.id ?? null,
    can: (action) => allowed.includes(action),
    ready: !isLoading,
  };
  return <AccessScopeContext.Provider value={value}>{children}</AccessScopeContext.Provider>;
}

export function useAccessScope(): AccessScope {
  const scope = useContext(AccessScopeContext);
  if (!scope) throw new Error('useAccessScope() outside the access layout');
  return scope;
}

const ALL = '__all__';

/** A platform admin's tenant picker — nothing for anyone else (their tenant is fixed). */
export function TenantPicker() {
  const { platform, tenantId, setTenantId } = useAccessScope();
  if (!platform) return null;
  return (
    <Select value={tenantId ?? ALL} onValueChange={(v) => setTenantId(v === ALL ? undefined : v)}>
      <SelectTrigger className="w-44" aria-label="Tenant">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All tenants</SelectItem>
        {ACCESS_TENANTS.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
