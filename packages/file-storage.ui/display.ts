import type { FileCategoryRules, FileCategorySummary, FileRecord, FileRow, RejectionReason, RejectionRow, Retention } from './api/file-storage-api.types';

/** A size: `3.1 MB`. */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

const CONTENT_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/tiff': 'TIFF',
  'image/heic': 'HEIC',
  'image/gif': 'GIF',
  'text/csv': 'CSV',
  'text/plain': 'Text',
  'text/html': 'HTML',
  'video/mp4': 'MP4',
  'application/zip': 'ZIP',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/msword': 'DOC',
};

/** `application/pdf` → `PDF`; an unknown type by its subtype. */
export const contentTypeLabel = (contentType: string) =>
  CONTENT_TYPES[contentType.toLowerCase()] ?? (contentType.split('/')[1] ?? contentType).toUpperCase();

/** `PDF, JPEG, PNG` — an empty list accepts anything. */
export const contentTypesLabel = (types: string[]) => (types.length === 0 ? 'any type' : types.map(contentTypeLabel).join(', '));

/** `7 years`, `90 days`, `indefinite`. */
export function retentionLabel(retention: Retention): string {
  if (retention === 'indefinite') return 'indefinite';
  const days = retention.keepForDays;
  if (days >= 365 && days % 365 === 0) return days === 365 ? '1 year' : `${days / 365} years`;
  return days === 1 ? '1 day' : `${days} days`;
}

/** A shared link's life: `1 hour`, `15 minutes`. */
export function durationLabel(seconds: number): string {
  if (seconds % 86400 === 0) return seconds === 86400 ? '1 day' : `${seconds / 86400} days`;
  if (seconds % 3600 === 0) return seconds === 3600 ? '1 hour' : `${seconds / 3600} hours`;
  if (seconds % 60 === 0) return seconds === 60 ? '1 minute' : `${seconds / 60} minutes`;
  return `${seconds} seconds`;
}

/** An upload type's label from the catalog — its key when the catalog doesn't know it (a refused misspelling). */
export function categoryLabel(key: string, categories: readonly Pick<FileCategorySummary, 'key' | 'base'>[] | undefined): string {
  return categories?.find((c) => c.key === key)?.base.label ?? key;
}

/** Where a type stands for the viewer: on, off for this tenant (its own choice), off for everyone (the platform's). */
export function categoryStatus(c: { base: Pick<FileCategoryRules, 'active'>; effective: Pick<FileCategoryRules, 'active'> }): 'on' | 'tenant-off' | 'off' {
  if (!c.base.active) return 'off';
  return c.effective.active ? 'on' : 'tenant-off';
}

/** The rule fields a tenant may tighten — in the order the type page lists them. */
export const TUNABLE_FIELDS = ['allowedContentTypes', 'allowedExtensions', 'maxSizeBytes', 'minSizeBytes', 'onUnscannable', 'signedLinkExpirySeconds'] as const;

/** A tenant narrowed at least one rule of this type for itself. */
export const isTightened = (c: Pick<FileCategorySummary, 'override'>) => !!c.override && TUNABLE_FIELDS.some((f) => c.override![f] != null);

/** The refusal reasons, in order of how often they're the answer — the badge, and the heading the overview uses. */
export const REJECTION_REASONS: Record<RejectionReason, { badge: string; title: string; variant: 'red' | 'orange' }> = {
  'validation-failed': { badge: 'rule', title: 'Broke a rule — type, extension, size, or not what it claims to be', variant: 'red' },
  'category-unavailable': { badge: 'type off', title: 'Upload type unknown or turned off', variant: 'orange' },
  'scan-rejected': { badge: 'scan', title: "Failed the malware scan, or couldn't be scanned where that's refused", variant: 'red' },
  'quota-exceeded': { badge: 'storage full', title: "The tenant's storage is full", variant: 'orange' },
};

export const REJECTION_REASON_CODES = Object.keys(REJECTION_REASONS) as RejectionReason[];

/**
 * A refusal's message in plain words — the validator's, the scanner's and the quota's own sentences, shortened;
 * anything else as the API wrote it (the screen keeps the API's message beside it). "Not available" covers a key the
 * catalog doesn't have and a type turned off — the catalog tells them apart.
 */
export function rejectionSummary(
  row: Pick<RejectionRow, 'message' | 'category'>,
  categories?: readonly Pick<FileCategorySummary, 'key' | 'base' | 'effective'>[],
): string {
  const m = row.message;
  let match: RegExpMatchArray | null;
  if ((match = m.match(/^content type '([^']+)' is not accepted/))) return `${contentTypeLabel(match[1])} isn't accepted`;
  if ((match = m.match(/^file extension '([^']+)' is not accepted/))) {
    return match[1] === '(none)' ? 'a file without an extension isn’t accepted' : `${match[1]} files aren't accepted`;
  }
  if ((match = m.match(/^file is (\d+) bytes; category '[^']+' allows at most (\d+)/))) {
    return `${formatBytes(Number(match[1]))} — at most ${formatBytes(Number(match[2]))}`;
  }
  if ((match = m.match(/^file is (\d+) bytes; category '[^']+' requires at least/))) return `${formatBytes(Number(match[1]))} — empty or cut short`;
  if ((match = m.match(/(\d+) of (\d+) bytes used/))) {
    // Near the limit both sides round to the same size ("70 MB of 70 MB") — the share says it.
    const share = Math.floor((Number(match[1]) / Number(match[2])) * 1000) / 10;
    return `${share}% of ${formatBytes(Number(match[2]))} used`;
  }
  if ((match = m.match(/content is not '([^']+)'/))) return `not a ${contentTypeLabel(match[1])} — it doesn't start like one`;
  if (/could not be scanned/.test(m)) return "couldn't be scanned — this type refuses those";
  if (/malware/.test(m)) return 'failed the malware scan';
  if (/is not available$/.test(m) && categories) {
    const c = categories.find((x) => x.key === row.category);
    if (!c) return 'not an upload type the app knows';
    return categoryStatus(c) === 'off' ? 'turned off for everyone' : 'turned off for this tenant';
  }
  return m;
}

/** The file's own name — an older row without one by its id. */
export const fileName = (f: Pick<FileRow, 'filename' | 'id'>) => f.filename ?? `file ${f.id.slice(0, 8)}`;

type Retained = Pick<FileRecord, 'retainUntil'>;

/** Its retention date has passed (the retention run deletes it, unless held). */
export const pastRetention = (f: Retained, now = new Date()) => f.retainUntil !== null && new Date(f.retainUntil) <= now;

/** Inside its retention date — a tenant admin can't delete it yet. */
export const insideRetention = (f: Retained, now = new Date()) => f.retainUntil !== null && new Date(f.retainUntil) > now;

/**
 * Why the viewer can't delete it — null when they can. The API's rules: nobody while it's held; a tenant admin not
 * before its retention date (a platform admin may — an erasure, audited as such).
 */
export function deleteBlocker(f: Pick<FileRecord, 'retainUntil' | 'legalHold'>, platform: boolean, keptUntil: string): string | null {
  if (f.legalHold) return 'It’s on legal hold — release the hold first.';
  if (!platform && insideRetention(f)) return `Kept until ${keptUntil} — it can’t be deleted before then.`;
  return null;
}

/** `invoices/tenant_acme/…/87f91d9f` — a storage path's ends, the middle elided. */
export function shortRef(fileRef: string): string {
  const parts = fileRef.split('/');
  if (parts.length <= 3) return fileRef;
  return `${parts[0]}/${parts[1]}/…/${parts[parts.length - 1].slice(0, 8)}`;
}
