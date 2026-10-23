import type { FieldDef, FieldOptionsMap, QueryDef } from '@/ascendra-ui';
import type { CatalogAction, Role } from '../api/authorization-api.types';

/** The lists' query ids — for a link or row action that runs one (`authorizationLinks.people({ queryId, params })`). */
export const authorizationQueryIds = {
  everyone: 'everyone',
  peopleFilter: 'people-filter',
  activeDelegations: 'active-delegations',
  delegationsFilter: 'delegations-filter',
  recentDenials: 'recent-denials',
  denialsFilter: 'denials-filter',
} as const;

/** Denials are kept 90 days (the app's access-denial-retention job). */
export const MAX_DENIAL_RANGE_DAYS = 90;

/** A platform admin may pick a tenant; for anyone else the API forces theirs, so the field isn't offered. */
const tenantParam: FieldDef = { name: 'tenantId', label: 'Tenant', type: 'select', span: 1, optional: true };

/**
 * People — the directory by name. The server searches (name or email) and filters by role or "no role"; the two
 * exclude each other.
 */
export function peopleQueryDefs(platform: boolean): QueryDef[] {
  return [
    { id: authorizationQueryIds.everyone, title: 'Everyone', description: 'Everyone, by name.', group: 'query' },
    {
      id: authorizationQueryIds.peopleFilter,
      title: 'Find people',
      description: 'By name or email, by the role they hold, or those holding none.',
      info: 'A role and "no role" exclude each other.',
      group: 'filter',
      columns: { sm: 1, md: 2, lg: 3 },
      params: [
        { name: 'search', label: 'Name or email', type: 'text', span: 1, maxLength: 200, optional: true, placeholder: 'farah' },
        { name: 'roleId', label: 'Holds role', type: 'select', span: 1, optional: true },
        { name: 'roleless', label: 'No role', checkboxLabel: 'Holding no role — can do nothing yet', type: 'checkbox', span: 1, optional: true },
        ...(platform ? [tenantParam] : []),
      ],
    },
  ];
}

/** Delegations — active by default; a filter by state and party. "Expiring" means ending within 7 days. */
export function delegationQueryDefs(platform: boolean): QueryDef[] {
  return [
    { id: authorizationQueryIds.activeDelegations, title: 'Active', description: 'Everything lent and still running, newest first.', group: 'query' },
    {
      id: authorizationQueryIds.delegationsFilter,
      title: 'Filter delegations',
      description: 'By state, and by who lent or got it.',
      info: 'Lapsed: still running, but lending something the lender no longer holds — it grants nothing for that.',
      group: 'filter',
      columns: { sm: 1, md: 2, lg: 3 },
      params: [
        { name: 'status', label: 'State', type: 'select', span: 1, optional: true },
        { name: 'userId', label: 'Lender or receiver', type: 'text', span: 1, maxLength: 256, optional: true, placeholder: 'farah.garcia@acme.test' },
        ...(platform ? [tenantParam] : []),
      ],
    },
  ];
}

/** Denied requests — newest first; a filter by person, action and when (required, up to 90 days). */
export function denialQueryDefs(platform: boolean): QueryDef[] {
  return [
    { id: authorizationQueryIds.recentDenials, title: 'Recent', description: 'The latest refusals, newest first.', group: 'query' },
    {
      id: authorizationQueryIds.denialsFilter,
      title: 'Filter denied requests',
      description: 'By person, by the action they lacked, and when.',
      info: `When is required (up to ${MAX_DENIAL_RANGE_DAYS} days); the rest are optional.`,
      group: 'filter',
      columns: { sm: 1, md: 2, lg: 3 },
      params: [
        { name: 'actorId', label: 'Person', type: 'text', span: 1, maxLength: 256, optional: true, placeholder: 'hana.ito@acme.test' },
        { name: 'action', label: 'Needed', type: 'select', span: 1, optional: true },
        ...(platform ? [tenantParam] : []),
        { _type: 'section', title: 'When', showTitle: true },
        {
          name: 'deniedRange',
          label: 'Refused between',
          type: 'daterange',
          span: 'full',
          editable: true,
          info: `Inclusive of both dates, up to ${MAX_DENIAL_RANGE_DAYS} days`,
          mandatory: true,
          required: true,
          maxRangeDays: MAX_DENIAL_RANGE_DAYS,
          maxDate: 'today',
          defaultValue: { from: '-6d', to: 'today' },
        },
      ],
    },
  ];
}

export interface TenantOption {
  id: string;
  name: string;
}

/** The selects' options: roles and actions from the catalog, the fixed states, and the app's tenants. */
export function authorizationFieldOptions(roles: readonly Role[], actions: readonly CatalogAction[], tenants: readonly TenantOption[]): FieldOptionsMap {
  const tenantOptions = tenants.map((t) => ({ value: t.id, label: t.name }));
  return {
    [authorizationQueryIds.peopleFilter]: {
      roleId: roles.map((r) => ({ value: r.id, label: r.id })),
      tenantId: tenantOptions,
    },
    [authorizationQueryIds.delegationsFilter]: {
      status: [
        { value: 'active', label: 'active' },
        { value: 'expiring', label: 'expiring (7 days)' },
        { value: 'lapsed', label: 'lapsed' },
        { value: 'expired', label: 'expired' },
        { value: 'revoked', label: 'revoked' },
      ],
      tenantId: tenantOptions,
    },
    [authorizationQueryIds.denialsFilter]: {
      action: actions.map((a) => ({ value: a.name, label: a.name })),
      tenantId: tenantOptions,
    },
  };
}
