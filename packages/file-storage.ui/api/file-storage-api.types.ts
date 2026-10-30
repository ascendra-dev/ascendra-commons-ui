/**
 * file-storage.api's wire shapes — dates are ISO strings on the wire. Mirrors `file-storage.core`'s
 * `file-storage-admin.types.ts`, `file-record.interface.ts` and `file-category.ts`, plus what the API adds (names).
 */

export type ScanVerdict = 'clean' | 'unscannable';

/** Why an upload was turned away — nothing was stored for it. */
export type RejectionReason = 'category-unavailable' | 'validation-failed' | 'quota-exceeded' | 'scan-rejected';

/** GET /files — one stored file. */
export interface FileRow {
  id: string;
  tenantId: string;
  /** The upload type's key — `invoice.supporting-document`. */
  category: string;
  contentType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedByName: string | null;
  /** The uploader's own name for it, cleaned; null on older rows. */
  filename: string | null;
  /** null on rows written before the verdict was kept. */
  scanVerdict: ScanVerdict | null;
  /** Fixed at upload — can't be deleted before it (by a tenant), deleted after it by the retention run. null = indefinite. */
  retainUntil: string | null;
  /** When a legal hold was placed — null when not held. */
  heldAt: string | null;
  createdAt: string;
  attachmentCount: number;
}

export interface LegalHold {
  heldAt: string;
  heldBy: string;
  reason: string;
}

export interface FileRecord {
  id: string;
  tenantId: string;
  fileRef: string;
  category: string;
  contentType: string;
  sizeBytes: number;
  /** SHA-256 of the bytes, hex. */
  contentHash: string | null;
  uploadedBy: string;
  filename: string | null;
  scanVerdict: ScanVerdict | null;
  retainUntil: string | null;
  legalHold: LegalHold | null;
  createdAt: string;
}

/** The file's link to one business entity — an invoice, a dispute. Detaching it leaves the file. */
export interface Attachment {
  id: string;
  fileRecordId: string;
  attachedToType: string;
  attachedToId: string;
  category: string;
  createdAt: string;
}

/** GET /files/:id — metadata only; the content is `downloadUrl`. */
export interface FileDetail {
  fileRecord: FileRecord;
  attachments: Attachment[];
  uploadedByName: string | null;
  heldByName: string | null;
}

/** GET /files/:id/access-log — who opened it. */
export interface AccessLogEntry {
  id: string;
  /** null for a shared link — no person. */
  actorId: string | null;
  actorName: string | null;
  via: 'actor' | 'signed-link';
  purpose: string;
  occurredAt: string;
}

export interface DownloadUrl {
  /** Root-relative or absolute; short-lived. */
  url: string;
  expiresAt: string;
}

/** GET /files/storage-usage — one tenant × upload type. */
export interface StorageUsageRow {
  tenantId: string;
  category: string;
  fileCount: number;
  totalBytes: number;
}

/** GET /files/quotas — a tenant's storage limit and what it uses now. */
export interface StorageQuota {
  tenantId: string;
  maxBytes: number;
  updatedAt: string;
  updatedBy: string;
  usedBytes: number;
  fileCount: number;
}

/** GET /files/orphans — a file attached to nothing. */
export interface OrphanRow {
  id: string;
  tenantId: string;
  category: string;
  fileRef: string;
  filename: string | null;
  sizeBytes: number;
  createdAt: string;
}

/** GET /files/duplicates — the same bytes stored more than once in one tenant. Reported, never merged. */
export interface DuplicateGroup {
  tenantId: string;
  contentHash: string;
  fileCount: number;
  totalBytes: number;
  /** Bytes beyond the first copy. */
  wastedBytes: number;
  /** Up to 10, oldest first. */
  fileIds: string[];
  firstUploadedAt: string;
  lastUploadedAt: string;
}

/** GET /files/stray-blobs — bytes in a bucket no file record holds. */
export interface StrayBlob {
  fileRef: string;
  sizeBytes: number;
  modifiedAt: string;
}

/** GET /files/rejections — one refused upload. */
export interface RejectionRow {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string | null;
  category: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  reason: RejectionReason;
  /** The API's own words — kept verbatim. */
  message: string;
  occurredAt: string;
}

/** GET /files/stats — uploads and refusals over whole calendar days in the viewer's zone. */
export interface FileStats {
  since: string;
  until: string;
  totals: { uploads: number; bytes: number; rejected: number; unscannable: number };
  /** Every day of the window, a quiet one at 0. `date` is `YYYY-MM-DD` in the query's zone. */
  byDay: Array<{ date: string; uploads: number; bytes: number; rejected: number }>;
  /** Per upload type key — a key the catalog doesn't know shows up here too (a refused misspelling). */
  byCategory: Array<{ category: string; fileCount: number; totalBytes: number; rejected: number }>;
  byScanVerdict: Array<{ verdict: ScanVerdict | 'unknown'; count: number }>;
  byRejectionReason: Array<{ reason: RejectionReason; count: number }>;
}

/** GET /files/retention — what the retention run is working on. */
export interface FileRetentionVolume {
  files: {
    count: number;
    totalBytes: number;
    /** Past their date and not held — the next run deletes these. */
    pastRetention: number;
    expiringWithin30Days: number;
    indefinite: number;
    held: number;
    oldestCreatedAt: string | null;
  };
  accessLog: { rows: number; oldestAt: string | null };
  rejections: { rows: number; oldestAt: string | null };
  policy: { accessLogDays: number; rejectionLogDays: number };
}

/** POST /files/retention/run */
export interface RetentionRunResult {
  filesDeleted: number;
  bytesFreed: number;
  /** Records gone whose bytes couldn't be — they show up as stray blobs. */
  blobDeleteFailures: number;
  accessLogRowsDeleted: number;
  rejectionRowsDeleted: number;
  expiredUploadsDropped: number;
}

/** GET /files/orphans/purge-preview — orphans older than the bound: those the purge deletes, and those it leaves. */
export interface OrphanPurgePreview {
  purgeable: { count: number; bytes: number };
  /** On legal hold. */
  held: number;
  /** Inside their retention date. */
  retained: number;
}

/** POST /files/orphans/purge — held files and files inside their retention date are left. */
export interface OrphanPurgeResult {
  deleted: number;
  bytesFreed: number;
}

export type Retention = { keepForDays: number } | 'indefinite';

/** A declared upload type's rules. */
export interface FileCategoryRules {
  key: string;
  label: string;
  description?: string;
  bucket: string;
  /** Empty = any (still under the app-wide denylist). */
  allowedContentTypes: string[];
  maxSizeBytes: number;
  minSizeBytes?: number;
  allowedExtensions?: string[];
  onUnscannable: 'reject' | 'allow';
  /** A shared link's life, seconds — omitted for the module default. */
  signedLinkExpirySeconds?: number;
  retention: Retention;
  active: boolean;
}

/** A tenant's tightening — each field set narrows the base; an unset one inherits it. */
export interface FileCategoryOverride {
  allowedContentTypes?: string[] | null;
  maxSizeBytes?: number | null;
  minSizeBytes?: number | null;
  allowedExtensions?: string[] | null;
  onUnscannable?: 'reject' | 'allow' | null;
  signedLinkExpirySeconds?: number | null;
  active: boolean;
}

/** GET /files/categories/:key — the base, a tenant's override (none for the base-only view) and the two merged. */
export interface FileCategoryView {
  key: string;
  base: FileCategoryRules;
  override: FileCategoryOverride | null;
  effective: FileCategoryRules & { minSizeBytes: number };
}

/** GET /files/categories — each with how much of it there is. */
export interface FileCategorySummary extends FileCategoryView {
  usage: { key: string; fileCount: number; totalBytes: number; lastUploadedAt: string | null };
}

/** PATCH /files/categories/:key — `null` clears a field (inherit); a platform admin names the tenant. */
export type FileCategoryOverrideInput = Partial<Omit<FileCategoryOverride, 'active'>> & { active?: boolean; tenantId?: string };
