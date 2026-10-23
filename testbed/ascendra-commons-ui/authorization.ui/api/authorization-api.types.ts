/** Wire shapes of `authorization.api` — dates arrive as ISO strings. */

export type ActionScope = 'platform' | 'tenant';

export interface Role {
  id: string;
  description: string | null;
  grantsAll: boolean;
  actions: string[];
  scope: ActionScope;
  platformActions: string[];
}

export interface RoleDetail extends Role {
  holderCount: number;
}

/** `GET /authz/roles/assignable` — every role, and whether the viewer may give it here. */
export interface AssignableRole extends Role {
  assignable: boolean;
  reason?: string;
}

export interface CatalogAction {
  name: string;
  description: string | null;
  scope: ActionScope;
  roleIds: string[];
}

export interface CatalogHealth {
  inCodeNotInDb: string[];
  inDbNotInCode: string[];
  grantedButUndescribed: string[];
  describedCount: number;
  totalCount: number;
}

export interface Assignment {
  userId: string;
  tenantId: string | null;
  roleId: string;
  grantedAt: string;
  grantedBy: string | null;
  expiresAt: string | null;
  status: 'active' | 'expired';
}

export type DelegationStatus = 'active' | 'expired' | 'revoked';

export interface Delegation {
  id: string;
  granterId: string;
  granteeId: string;
  tenantId: string;
  actions: string[];
  /** What it no longer grants — the lender stopped holding them. */
  lapsedActions: string[];
  expiresAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
  reason: string | null;
  createdAt: string;
  createdBy: string;
  status: DelegationStatus;
}

export interface DirectoryUser {
  id: string;
  name: string;
  email?: string | null;
  tenantId: string | null;
}

export interface PersonRow extends DirectoryUser {
  roles: Array<{ roleId: string; tenantId: string | null; expiresAt: string | null }>;
}

export interface AccessExplanation {
  userId: string;
  tenantId: string | null;
  roles: Array<{ roleId: string; tenantId: string | null; grantsAll: boolean; grantedActions: string[]; expiresAt: string | null }>;
  delegations: Array<{ id: string; granterId: string; actions: string[]; lapsedActions: string[]; expiresAt: string }>;
  effectiveActions: string[] | '*';
  action?: string;
  allowed?: boolean;
  reason?: string;
}

export interface PersonProfile {
  user: DirectoryUser;
  assignments: Assignment[];
  delegations: Delegation[];
  access: AccessExplanation;
}

export interface WhoCan {
  action: string;
  tenantId: string | null;
  roles: Array<{ roleId: string; grantsAll: boolean; holderUserIds: string[] }>;
  delegations: Array<{ id: string; granterId: string; granteeId: string; expiresAt: string }>;
}

export interface AccessStats {
  tenantId: string | null;
  usersWithRole: number;
  roleHolders: Array<{ roleId: string; holders: number }>;
  platformHolders: number;
  activeDelegations: number;
  lapsedDelegations: number;
  delegationsExpiring7d: number;
  assignmentsExpiring7d: number;
  /** `null` when the app wired no user directory. */
  users: number | null;
  usersWithoutRole: number | null;
}

export interface Denial {
  id: string;
  actorId: string;
  tenantId: string | null;
  action: string;
  method: string;
  route: string;
  windowStart: string;
  count: number;
  firstDeniedAt: string;
  lastDeniedAt: string;
  correlationId: string | null;
}

export interface DenialSummary {
  total: number;
  actors: number;
  topActions: Array<{ action: string; count: number; actors: number }>;
  topActors: Array<{ actorId: string; tenantId: string | null; count: number; actions: number }>;
}

export interface MyDelegations {
  granted: Delegation[];
  received: Delegation[];
}
