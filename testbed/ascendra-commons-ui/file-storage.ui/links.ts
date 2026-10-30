import { buildQuerySearch, type TriggerParams } from '@/ascendra-ui';

/**
 * Fixed base path (`/files`) — where `packages/files` (the console's shell) mounts this module's pages. Files and
 * Refused uploads take a run — a query id from `fileStorageQueryIds` / `rejectionQueryIds` and its params — which the
 * list runs on load (ascendra-ui's `buildQuerySearch`); without one it shows the table's last run.
 */
const run = (path: string, query?: { queryId: string; params?: TriggerParams }) =>
  query ? `${path}?${buildQuerySearch(query.queryId, query.params)}` : path;

export const fileStorageLinks = {
  overview: () => '/files',
  files: (query?: { queryId: string; params?: TriggerParams }) => run('/files/list', query),
  types: () => '/files/types',
  type: (key: string) => `/files/types/${encodeURIComponent(key)}`,
  rejections: (query?: { queryId: string; params?: TriggerParams }) => run('/files/rejections', query),
  storage: () => '/files/storage',
  /** Opens on a tab — stray blobs on a bucket. */
  cleanup: (tab?: 'orphans' | 'duplicates' | 'stray-blobs', bucket?: string) =>
    tab ? `/files/cleanup?tab=${tab}${bucket ? `&bucket=${encodeURIComponent(bucket)}` : ''}` : '/files/cleanup',
  retention: () => '/files/retention',
};
