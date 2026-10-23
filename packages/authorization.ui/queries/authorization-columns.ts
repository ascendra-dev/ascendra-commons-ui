import type { ColumnDef } from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { PersonRow } from '../api/authorization-api.types';
import type { DelegationRow, DenialRow } from './authorization-query-functions';

/** Each custom-formatted cell carries a `searchValue` matching what it renders (AUI-035). */
export const peopleColumns: ColumnDef<PersonRow>[] = [
  { key: 'name', label: 'Person', freeze: true, searchValue: (_v, row) => `${row.name} ${row.email ?? ''}` },
  { key: 'tenantId', label: 'Tenant', filter: true },
  { key: 'roles', label: 'Roles', sortable: false, searchValue: (_v, row) => row.roles.map((r) => r.roleId).join(' ') },
];

export const delegationColumns: ColumnDef<DelegationRow>[] = [
  { key: 'granterName', label: 'From → to', freeze: true, searchValue: (_v, row) => `${row.granterName} ${row.granteeName}` },
  { key: 'actions', label: 'Actions', sortable: false, searchValue: (_v, row) => row.actions.join(' ') },
  { key: 'expiresAt', label: 'Until', type: 'date', searchValue: (v) => formatDateTime(v as string) },
  { key: 'status', label: 'State', filter: true },
  { key: 'reason', label: 'Reason', sortable: false },
];

export const denialColumns: ColumnDef<DenialRow>[] = [
  { key: 'windowStart', label: 'Minute', type: 'date', freeze: true, searchValue: (v) => formatDateTime(v as string, { time: true }) },
  { key: 'actorName', label: 'Person', searchValue: (_v, row) => `${row.actorName} ${row.actorId}` },
  { key: 'action', label: 'Needed', filter: true },
  { key: 'route', label: 'Page', searchValue: (_v, row) => `${row.method} ${row.route}` },
  { key: 'count', label: 'Times', type: 'number', align: 'right' },
];
