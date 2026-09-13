import axios, { type AxiosError } from 'axios';
import { getSession } from 'next-auth/react';

import { ApiError, type ApiErrorPayload, type ApiResponse } from './types';

function toApiError(err: AxiosError): ApiError {
  const status = err.response?.status ?? 0;

  if (!err.response) {
    const code = err.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK_ERROR';
    return new ApiError(code, 'Network request failed. Please check your connection.', status);
  }

  const payload = err.response.data as ApiErrorPayload | undefined;

  if (payload && payload.success === false) {
    return new ApiError(
      payload.error.code,
      payload.error.message,
      status,
      payload.error.details
    );
  }

  // Fallback for non-standard error shapes
  const fallbackMessages: Record<number, string> = {
    400: 'Bad request.',
    401: 'You are not authenticated.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'A conflict occurred.',
    422: 'Validation failed.',
    429: 'Too many requests. Please slow down.',
    500: 'An internal server error occurred.',
  };

  return new ApiError(
    `HTTP_${status}`,
    fallbackMessages[status] ?? 'An unexpected error occurred.',
    status
  );
}

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

apiClient.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.user) {
    // @ts-expect-error — accessToken is added in next-auth callbacks
    const token: string | undefined = session.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (err: AxiosError) => Promise.reject(toApiError(err))
);

export { apiClient };
export type { ApiResponse };

