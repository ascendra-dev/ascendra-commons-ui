'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ascendra-ui';
import { useSession } from '../observability/auth/use-session';
import { FILE_TENANTS } from './tenants';

interface FileScope {
  /** Platform staff — no tenant of their own; the API shows them every tenant's rows. */
  platform: boolean;
  /** The tenant a platform admin is looking at (`undefined` = all); always the viewer's own for anyone else. */
  tenantId: string | undefined;
  setTenantId: (id: string | undefined) => void;
  actorId: string | null;
  can: (action: string) => boolean;
  ready: boolean;
}

const FileScopeContext = createContext<FileScope | null>(null);

/**
 * Who's looking, and at which tenant — the console's one piece of shared state. Lives in the layout, so it survives
 * moving between screens. "Platform" is file-storage.api's own default (`isPlatformAdmin`: no tenant).
 */
export function FileScopeProvider({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = useSession();
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const allowed = session?.allowedActions ?? [];
  const ownTenantId = session?.actor?.tenantId ?? null;
  const platform = !!session?.actor && ownTenantId === null;
  const value: FileScope = {
    platform,
    tenantId: platform ? picked : (ownTenantId ?? undefined),
    setTenantId: setPicked,
    actorId: session?.actor?.id ?? null,
    can: (action) => allowed.includes(action),
    ready: !isLoading,
  };
  return <FileScopeContext.Provider value={value}>{children}</FileScopeContext.Provider>;
}

export function useFileScope(): FileScope {
  const scope = useContext(FileScopeContext);
  if (!scope) throw new Error('useFileScope() outside the files layout');
  return scope;
}

const ALL = '__all__';

/** A platform admin's tenant picker — nothing for anyone else (their tenant is fixed). */
export function TenantPicker() {
  const { platform, tenantId, setTenantId } = useFileScope();
  if (!platform) return null;
  return (
    <Select value={tenantId ?? ALL} onValueChange={(v) => setTenantId(v === ALL ? undefined : v)}>
      <SelectTrigger className="w-44" aria-label="Tenant">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All tenants</SelectItem>
        {FILE_TENANTS.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
