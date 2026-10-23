import { api } from '@/ascendra-ui/lib/api';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, QueryParamValues } from '@/ascendra-ui';
import type {
  AccessExplanation,
  AccessStats,
  AssignableRole,
  Assignment,
  CatalogAction,
  CatalogHealth,
  Delegation,
  Denial,
  DenialSummary,
  DirectoryUser,
  MyDelegations,
  PersonProfile,
  PersonRow,
  Role,
  RoleDetail,
  WhoCan,
} from './authorization-api.types';

const enc = encodeURIComponent;
/** A tenant param a platform admin chose — omitted for everyone else (the API forces their own). */
const tenant = (tenantId?: string) => (tenantId ? { tenantId } : {});
/** `days` back from now — a period's start, computed when the request goes out. */
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const authorizationApi = {
  stats(tenantId?: string): Promise<AccessStats> {
    return api.get<AccessStats>('/authz/stats', tenant(tenantId));
  },

  /** GET /authz/users — the directory by name; `roleId` (holders) or `roleless`, `search`. */
  findUsers(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<PersonRow>> {
    const { roleless, ...rest } = params;
    return api.get<CursorListResponse<PersonRow>>('/authz/users', {
      ...rest,
      ...(roleless === 'true' ? { roleless: 'true' } : {}),
      limit,
      cursor,
    });
  },

  /** Names for ids — an assignment or delegation list shows people, not ids. */
  lookup(ids: readonly string[]): Promise<DirectoryUser[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return api.get<DirectoryUser[]>('/authz/users/lookup', { ids: [...new Set(ids)].join(',') });
  },

  person(id: string): Promise<PersonProfile> {
    return api.get<PersonProfile>(`/authz/users/${enc(id)}`);
  },

  roles(): Promise<Role[]> {
    return api.get<Role[]>('/authz/roles');
  },

  role(id: string): Promise<RoleDetail> {
    return api.get<RoleDetail>(`/authz/roles/${enc(id)}`);
  },

  assignableRoles(tenantId?: string): Promise<AssignableRole[]> {
    return api.get<AssignableRole[]>('/authz/roles/assignable', tenant(tenantId));
  },

  /** A role's active holders, newest grant first — Role screen. */
  holders(roleId: string, tenantId?: string): Promise<CursorListResponse<Assignment>> {
    return api.get<CursorListResponse<Assignment>>('/authz/assignments', { roleId, status: 'active', limit: 500, ...tenant(tenantId) });
  },

  /** Active role assignments ending within 7 days, soonest first — the Overview's "needs a look". */
  async expiringAssignments(tenantId?: string, limit = 5): Promise<Assignment[]> {
    const page = await api.get<CursorListResponse<Assignment>>('/authz/assignments', { status: 'active', expiring: '7d', limit: 100, ...tenant(tenantId) });
    return [...page.data].sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? '')).slice(0, limit);
  },

  actions(): Promise<CatalogAction[]> {
    return api.get<CatalogAction[]>('/authz/actions');
  },

  catalogHealth(): Promise<CatalogHealth> {
    return api.get<CatalogHealth>('/authz/action-catalog/health');
  },

  describeAction(name: string, description: string | null): Promise<void> {
    return api.patch<void>(`/authz/actions/${enc(name)}`, { description });
  },

  /** Give (or renew) a role. `tenantId: null` — all tenants (platform admins). */
  assign(userId: string, body: { roleId: string; tenantId?: string | null; expiresAt?: string }): Promise<void> {
    return api.post<void>(`/authz/users/${enc(userId)}/roles`, body);
  },

  assignMany(roleId: string, body: { userIds: string[]; tenantId?: string; expiresAt?: string }): Promise<{ assigned: string[] }> {
    return api.post<{ assigned: string[] }>(`/authz/roles/${enc(roleId)}/holders`, body);
  },

  revoke(userId: string, roleId: string, tenantId: string | null): Promise<void> {
    const query = tenantId === null ? '?global=true' : `?tenantId=${enc(tenantId)}`;
    return api.delete<void>(`/authz/users/${enc(userId)}/roles/${enc(roleId)}${query}`);
  },

  /** GET /authz/delegations — `status` (active / expired / revoked / lapsed), a party, newest first. */
  findDelegations(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<Delegation>> {
    const { status, within, ...rest } = params;
    if (status === 'expiring') {
      return api.get<CursorListResponse<Delegation>>('/authz/delegations/expiring', { ...rest, within: within ?? '7d', limit, cursor });
    }
    return api.get<CursorListResponse<Delegation>>('/authz/delegations', { ...rest, status, limit, cursor });
  },

  delegation(id: string): Promise<Delegation> {
    return api.get<Delegation>(`/authz/delegations/${enc(id)}`);
  },

  lend(body: { granteeId: string; actions: string[]; expiresAt: string; reason?: string }): Promise<Delegation> {
    return api.post<Delegation>('/authz/delegations', body);
  },

  revokeDelegation(id: string): Promise<void> {
    return api.delete<void>(`/authz/delegations/${enc(id)}`);
  },

  myAccess(): Promise<AccessExplanation> {
    return api.get<AccessExplanation>('/authz/me/access');
  },

  myDelegations(): Promise<MyDelegations> {
    return api.get<MyDelegations>('/authz/delegations/mine');
  },

  explain(userId: string, action?: string, tenantId?: string): Promise<AccessExplanation> {
    return api.get<AccessExplanation>('/authz/explain', { userId, ...(action ? { action } : {}), ...tenant(tenantId) });
  },

  whoCan(action: string, tenantId?: string): Promise<WhoCan> {
    return api.get<WhoCan>('/authz/who-can', { action, ...tenant(tenantId) });
  },

  /** GET /authz/denials — the filter form's params; `deniedRange` is one daterange field, two params on the wire. */
  findDenials(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<Denial>> {
    const { deniedRange, ...filters } = params;
    const { from: since, before: until } = dateRangeBounds(deniedRange);
    return api.get<CursorListResponse<Denial>>('/authz/denials', { ...filters, since, until, limit, cursor });
  },

  /** One person's denied requests over the last `days`, newest first — their page's Refused card. */
  recentDenialsOf(actorId: string, days: number, limit: number): Promise<CursorListResponse<Denial>> {
    return api.get<CursorListResponse<Denial>>('/authz/denials', { actorId, since: daysAgo(days), limit });
  },

  /** Totals and the most-refused actions and people over the last `days`. */
  denialSummary(days: number, tenantId?: string): Promise<DenialSummary> {
    return authorizationApi.denialSummarySince(daysAgo(days), tenantId);
  },

  denialSummarySince(since: string, tenantId?: string): Promise<DenialSummary> {
    return api.get<DenialSummary>('/authz/denials/summary', { since, ...tenant(tenantId) });
  },
};
