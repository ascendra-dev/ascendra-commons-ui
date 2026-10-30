import { api } from '@/ascendra-ui/lib/api';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, QueryParamValues } from '@/ascendra-ui';
import type {
  AccessLogEntry,
  DownloadUrl,
  DuplicateGroup,
  FileCategoryOverrideInput,
  FileCategorySummary,
  FileCategoryView,
  FileDetail,
  FileRetentionVolume,
  FileRow,
  FileStats,
  OrphanPurgePreview,
  OrphanPurgeResult,
  OrphanRow,
  RejectionRow,
  RetentionRunResult,
  StorageQuota,
  StorageUsageRow,
  StrayBlob,
} from './file-storage-api.types';

const enc = encodeURIComponent;
/** A platform admin's tenant filter — omitted for all tenants (and ignored by the API for anyone else). */
const tenant = (tenantId?: string) => (tenantId ? { tenantId } : {});

/** The filter form's fields → the API's: the range splits in two, a size in MB becomes bytes, "held" is a flag. */
function fileFilters(params: QueryParamValues) {
  const { uploadedRange, minSizeMb, held, ...rest } = params;
  const { from: uploadedAfter, before: uploadedBefore } = dateRangeBounds(uploadedRange);
  return {
    ...rest,
    ...(minSizeMb ? { minSizeBytes: Math.round(Number(minSizeMb) * 1024 * 1024) } : {}),
    ...(held === 'held' ? { held: 'true' } : held === 'not-held' ? { held: 'false' } : {}),
    uploadedAfter,
    uploadedBefore,
  };
}

/** Refusals over a picked range of days — the range splits in two, the end exclusive (the day after). */
function rejectionFilters(params: QueryParamValues) {
  const { occurredRange, ...rest } = params;
  const { from: occurredAfter, before: occurredBefore } = dateRangeBounds(occurredRange);
  return { ...rest, occurredAfter, occurredBefore };
}

export const fileStorageApi = {
  /** GET /files — newest first, keyset-paginated; tenant-scoped by the API. */
  findFiles(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<FileRow>> {
    return api.get<CursorListResponse<FileRow>>('/files', { ...fileFilters(params), limit, cursor });
  },

  /** GET /files/:id — metadata and attachments; a deleted file is a 404. */
  file(id: string): Promise<FileDetail> {
    return api.get<FileDetail>(`/files/${enc(id)}`);
  },

  /** POST /files/:id/download-url — `file.view_content`; a short-lived link, audited and access-logged. */
  downloadUrl(id: string): Promise<DownloadUrl> {
    return api.post<DownloadUrl>(`/files/${enc(id)}/download-url`, {});
  },

  /** GET /files/:id/access-log — who opened it, newest first. */
  accessLog(id: string, limit: number, cursor?: string): Promise<CursorListResponse<AccessLogEntry>> {
    return api.get<CursorListResponse<AccessLogEntry>>(`/files/${enc(id)}/access-log`, { limit, cursor });
  },

  /**
   * DELETE /files/:id — 409 while held, or (a tenant admin) before its retention date. A platform admin's early delete
   * is an erasure: it needs a `reason` (400 without), which the audit event carries.
   */
  deleteFile(id: string, reason?: string): Promise<void> {
    return api.delete<void>(`/files/${enc(id)}`, reason ? { params: { reason } } : undefined);
  },

  /** DELETE /files/:id/attachments/:aid — the file stays; the last one detached makes it an orphan. */
  detach(id: string, attachmentId: string): Promise<void> {
    return api.delete<void>(`/files/${enc(id)}/attachments/${enc(attachmentId)}`);
  },

  /** PUT /files/:id/hold — nobody can delete it and retention skips it until released. 409 when already held. */
  placeHold(id: string, reason: string): Promise<void> {
    return api.put<void>(`/files/${enc(id)}/hold`, { reason });
  },

  releaseHold(id: string): Promise<void> {
    return api.delete<void>(`/files/${enc(id)}/hold`);
  },

  /** GET /files/stats — `tz` is the viewer's zone, so a day is a day on their calendar. */
  stats(windowDays: number, timeZone: string, tenantId?: string): Promise<FileStats> {
    return api.get<FileStats>('/files/stats', { windowDays, tz: timeZone, ...tenant(tenantId) });
  },

  /** GET /files/rejections — refused uploads, newest first. */
  findRejections(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<RejectionRow>> {
    return api.get<CursorListResponse<RejectionRow>>('/files/rejections', { ...rejectionFilters(params), limit, cursor });
  },

  /** GET /files/storage-usage — per tenant × upload type. */
  async storageUsage(tenantId?: string): Promise<StorageUsageRow[]> {
    return (await api.get<{ data: StorageUsageRow[] }>('/files/storage-usage', tenant(tenantId))).data;
  },

  /** GET /files/quotas — every limit (a tenant admin: its own, or none). */
  async quotas(tenantId?: string): Promise<StorageQuota[]> {
    return (await api.get<{ data: StorageQuota[] }>('/files/quotas', tenant(tenantId))).data;
  },

  /** PUT /files/quotas/:tenantId — `file.quota.manage`, platform admins. Audited with before and after. */
  setQuota(tenantId: string, maxBytes: number): Promise<StorageQuota> {
    return api.put<StorageQuota>(`/files/quotas/${enc(tenantId)}`, { maxBytes });
  },

  clearQuota(tenantId: string): Promise<void> {
    return api.delete<void>(`/files/quotas/${enc(tenantId)}`);
  },

  /** GET /files/orphans — attached to nothing, newest first. */
  orphans(query: { tenantId?: string; olderThan?: Date }, limit: number, cursor?: string): Promise<CursorListResponse<OrphanRow>> {
    return api.get<CursorListResponse<OrphanRow>>('/files/orphans', { ...query, limit, cursor });
  },

  /** GET /files/orphans/purge-preview — what the purge would delete, and the orphans it leaves (held, still retained). */
  previewOrphanPurge(olderThanDays: number, tenantId?: string): Promise<OrphanPurgePreview> {
    return api.get<OrphanPurgePreview>('/files/orphans/purge-preview', { olderThanDays, ...tenant(tenantId) });
  },

  /** POST /files/orphans/purge — orphans older than that many days; held and still-retained ones stay. */
  purgeOrphans(olderThanDays: number, tenantId?: string): Promise<OrphanPurgeResult> {
    return api.post<OrphanPurgeResult>('/files/orphans/purge', { olderThanDays, ...tenant(tenantId) });
  },

  /** GET /files/duplicates — most wasted bytes first. */
  async duplicates(tenantId?: string, limit = 200): Promise<DuplicateGroup[]> {
    return (await api.get<{ data: DuplicateGroup[] }>('/files/duplicates', { ...tenant(tenantId), limit })).data;
  },

  /** GET /files/stray-blobs — platform admins; one store page per call (`data` may be short), 501 if the store can't list. */
  strayBlobs(bucket: string, cursor?: string, limit = 1000): Promise<CursorListResponse<StrayBlob>> {
    return api.get<CursorListResponse<StrayBlob>>('/files/stray-blobs', { bucket, cursor, limit });
  },

  /** DELETE /files/stray-blobs?fileRef= — re-checks first: 409 if a record holds it after all. */
  deleteStrayBlob(fileRef: string): Promise<void> {
    return api.delete<void>('/files/stray-blobs', { params: { fileRef } });
  },

  /** GET /files/retention — tenant-scoped by the API. */
  retention(tenantId?: string): Promise<FileRetentionVolume> {
    return api.get<FileRetentionVolume>('/files/retention', tenant(tenantId));
  },

  /** POST /files/retention/run — one pass now, every tenant; platform admins. */
  runRetention(): Promise<RetentionRunResult> {
    return api.post<RetentionRunResult>('/files/retention/run', {});
  },

  /** GET /files/categories — a platform admin with no tenant sees the base rules; with one, that tenant's. */
  async categories(tenantId?: string): Promise<FileCategorySummary[]> {
    return (await api.get<{ data: FileCategorySummary[] }>('/files/categories', tenant(tenantId))).data;
  },

  category(key: string, tenantId?: string): Promise<FileCategoryView> {
    return api.get<FileCategoryView>(`/files/categories/${enc(key)}`, tenant(tenantId));
  },

  /**
   * PATCH /files/categories/:key — a tenant's override may only tighten (a loosening is a 422 naming the field);
   * `null` clears a field. A platform admin naming no tenant may only turn the base back on (`{ active: true }`).
   */
  updateCategory(key: string, input: FileCategoryOverrideInput): Promise<FileCategoryView> {
    return api.patch<FileCategoryView>(`/files/categories/${enc(key)}`, input);
  },

  /** DELETE /files/categories/:key — off for the tenant (or, a platform admin with no tenant, for everyone). */
  deactivateCategory(key: string, tenantId?: string): Promise<void> {
    return api.delete<void>(`/files/categories/${enc(key)}`, { params: tenant(tenantId) });
  },
};
