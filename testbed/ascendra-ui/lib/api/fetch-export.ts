import type { AxiosRequestConfig } from 'axios';

import { apiClient } from './client';
import type { ExportResult } from './types';

/**
 * GETs an api-contract.md Rule 9 export route (e.g. `/audit/events.csv`) as a file and reads its
 * export headers into an `ExportResult`. No default timeout — an export can legitimately run long;
 * pass `config.timeout` to cap it.
 */
export async function fetchExport(
  url: string,
  params?: Record<string, unknown>,
  config?: AxiosRequestConfig,
): Promise<ExportResult> {
  const { data, headers } = await apiClient.get<Blob>(url, {
    params,
    responseType: 'blob',
    timeout: 0,
    ...config,
  });
  return {
    blob: data,
    filename: filenameFromDisposition(headers['content-disposition']),
    rowCount: numberHeader(headers['x-export-row-count']),
    truncated: headers['x-export-truncated'] === undefined ? undefined : headers['x-export-truncated'] === 'true',
    limit: numberHeader(headers['x-export-limit']),
  };
}

function numberHeader(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function filenameFromDisposition(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(value);
  if (encoded) return decodeURIComponent(encoded[1].trim());
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(value);
  return plain?.[1].trim() || undefined;
}
