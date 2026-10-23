import { LuBookOpen, LuGauge, LuHandshake, LuIdCard, LuSearchCheck, LuShieldAlert, LuShieldCheck, LuUsers } from 'react-icons/lu';
import type { ModuleNavEntry } from '../shared/nav';
import { authorizationLinks } from './links';

/**
 * The access console's own sidebar. Every entry but My access needs `authz.view`; My access is anyone's (it reads
 * `GET /authz/me/access`, which needs no action) — `requiredAction: ''` marks it always shown.
 */
export const authorizationNav: ModuleNavEntry[] = [
  { id: 'access-overview', label: 'Overview', href: authorizationLinks.overview(), icon: LuGauge, requiredAction: 'authz.view' },
  { id: 'access-people', label: 'People', href: authorizationLinks.people(), icon: LuUsers, requiredAction: 'authz.view' },
  { id: 'access-roles', label: 'Roles', href: authorizationLinks.roles(), icon: LuShieldCheck, requiredAction: 'authz.view' },
  { id: 'access-delegations', label: 'Delegations', href: authorizationLinks.delegations(), icon: LuHandshake, requiredAction: 'authz.view' },
  { id: 'access-checker', label: 'Access checker', href: authorizationLinks.checker(), icon: LuSearchCheck, requiredAction: 'authz.view' },
  { id: 'access-denials', label: 'Denied requests', href: authorizationLinks.denials(), icon: LuShieldAlert, requiredAction: 'authz.view' },
  { id: 'access-catalog', label: 'Action catalog', href: authorizationLinks.catalog(), icon: LuBookOpen, requiredAction: 'authz.view' },
];

/** Everyone's — shown to any signed-in user. */
export const authorizationSelfNav: ModuleNavEntry[] = [
  { id: 'access-me', label: 'My access', href: authorizationLinks.mine(), icon: LuIdCard, requiredAction: '' },
];
