export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
