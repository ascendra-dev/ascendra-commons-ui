import { createCursorQueryFn } from '@/ascendra-ui';
import type { CursorListResponse, QueryFunctionMap } from '@/ascendra-ui';
import { authorizationApi } from '../api/authorization-api.client';
import type { Delegation, Denial, PersonRow } from '../api/authorization-api.types';

const PAGE_SIZE = 50;

/** A delegation with its two people's names — the list shows people, not ids. */
export type DelegationRow = Delegation & { granterName: string; granteeName: string };
/** A denial window with the person's name. */
export type DenialRow = Denial & { actorName: string };

/** One directory lookup per page: names for every id on it (an id the directory doesn't know stays an id). */
async function withNames<T, R>(page: CursorListResponse<T>, idsOf: (row: T) => string[], attach: (row: T, name: (id: string) => string) => R) {
  const users = await authorizationApi.lookup(page.data.flatMap(idsOf)).catch(() => []);
  const names = new Map(users.map((u) => [u.id, u.name]));
  const name = (id: string) => names.get(id) ?? id;
  return { ...page, data: page.data.map((row) => attach(row, name)) };
}

const findDelegations = async (params: Parameters<typeof authorizationApi.findDelegations>[0], cursor?: string) =>
  withNames(
    await authorizationApi.findDelegations(params, PAGE_SIZE, cursor),
    (d) => [d.granterId, d.granteeId],
    (d, name): DelegationRow => ({ ...d, granterName: name(d.granterId), granteeName: name(d.granteeId) }),
  );

const findDenials = async (params: Parameters<typeof authorizationApi.findDenials>[0], cursor?: string) =>
  withNames(await authorizationApi.findDenials(params, PAGE_SIZE, cursor), (d) => [d.actorId], (d, name): DenialRow => ({ ...d, actorName: name(d.actorId) }));

export const peopleQueryFunctions: QueryFunctionMap<PersonRow> = {
  everyone: createCursorQueryFn((params, cursor) => authorizationApi.findUsers(params, PAGE_SIZE, cursor)),
  'people-filter': createCursorQueryFn((params, cursor) => authorizationApi.findUsers(params, PAGE_SIZE, cursor)),
};

export const delegationQueryFunctions: QueryFunctionMap<DelegationRow> = {
  'active-delegations': createCursorQueryFn((params, cursor) => findDelegations({ ...params, status: 'active' }, cursor)),
  'delegations-filter': createCursorQueryFn((params, cursor) => findDelegations(params, cursor)),
};

export const denialQueryFunctions: QueryFunctionMap<DenialRow> = {
  'recent-denials': createCursorQueryFn((params, cursor) => findDenials(params, cursor)),
  'denials-filter': createCursorQueryFn((params, cursor) => findDenials(params, cursor)),
};
