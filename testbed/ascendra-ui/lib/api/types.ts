/** api-contract.md Rule 4, page-based list meta (the default shape). */
export interface PageMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/** api-contract.md Rule 4, cursor-based list meta — no page/total, since computing them needs the COUNT(*) cursor pagination avoids. */
export interface CursorMeta {
  nextCursor?: string;
}

/** api-contract.md Rule 4 list response — `M` picks page-based (default) or cursor-based meta. */
export interface ListResponse<T, M = PageMeta> {
  data: T[];
  meta: M;
}

export type PageListResponse<T> = ListResponse<T, PageMeta>;
export type CursorListResponse<T> = ListResponse<T, CursorMeta>;

/** api-contract.md Rule 9 — an exported file plus what its response headers report about it. */
export interface ExportResult {
  blob: Blob;
  /** From `Content-Disposition`; absent when the server doesn't name the file. */
  filename?: string;
  /** Rows in the file (`X-Export-Row-Count`). */
  rowCount?: number;
  /** More rows matched than the server's cap allowed (`X-Export-Truncated`). */
  truncated?: boolean;
  /** The server's row cap (`X-Export-Limit`). */
  limit?: number;
}

/** api-contract.md Rule 1 — every error response body, flat. */
export interface ApiErrorPayload {
  statusCode: number;
  /** The HTTP reason phrase, e.g. "Unprocessable Entity". */
  error: string;
  /** An array only when several fields fail validation at once. */
  message: string | string[];
  /** Set only for a typed business-rule violation (Rule 2) — branch on this, never on message. */
  code: string | null;
  path: string;
}

export class ApiError extends Error {
  constructor(
    /** The server's Rule 1 `code`, else `HTTP_<status>`, `TIMEOUT` or `NETWORK_ERROR`. */
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
