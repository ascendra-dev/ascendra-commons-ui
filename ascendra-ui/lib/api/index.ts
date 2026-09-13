import { type AxiosRequestConfig } from 'axios';

import { apiClient } from './client';
import { type ApiResponse } from './types';

export const api = {
  get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig) {
    return apiClient.get<ApiResponse<T>>(url, { params, ...config });
  },

  post<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return apiClient.post<ApiResponse<T>>(url, body, config);
  },

  put<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return apiClient.put<ApiResponse<T>>(url, body, config);
  },

  patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
    return apiClient.patch<ApiResponse<T>>(url, body, config);
  },

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return apiClient.delete<ApiResponse<T>>(url, config);
  },
};

export { ApiError, isApiError } from './types';
export type { ApiResponse, ApiErrorPayload, PaginationMeta } from './types';
