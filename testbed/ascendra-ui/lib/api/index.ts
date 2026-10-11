import { type AxiosRequestConfig } from 'axios';

import { apiClient } from './client';

/**
 * Thin wrappers over `apiClient` that resolve to the response body. Per api-contract.md Rule 3 the
 * body is the resource itself, with no envelope — `T` is that resource (or a Rule 4 `ListResponse`).
 * Use `apiClient` directly when you need the headers, e.g. `fetchExport`.
 */
export const api = {
  async get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.get<T>(url, { params, ...config })).data;
  },

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.post<T>(url, body, config)).data;
  },

  async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.put<T>(url, body, config)).data;
  },

  async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.patch<T>(url, body, config)).data;
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await apiClient.delete<T>(url, config)).data;
  },
};

export { ApiError, isApiError } from './types';
export { fetchExport } from './fetch-export';
export type {
  ApiErrorPayload,
  PageMeta,
  CursorMeta,
  ListResponse,
  PageListResponse,
  CursorListResponse,
  ExportResult,
} from './types';
