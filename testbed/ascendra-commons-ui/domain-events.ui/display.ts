import type { DeliveryMethod, DeliveryStatus } from './api/domain-events-api.types';

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  delivered: 'delivered',
  no_listeners: 'no listeners',
  dispatch_failed: 'dispatch failed',
};

/** How a delivery's status reads: `no listeners`, not `no_listeners`. */
export const statusLabel = (status: DeliveryStatus) => STATUS_LABELS[status];

/** Its badge colour: delivered green, no listeners amber (a wiring gap), dispatch failed red (the transport broke). */
export function statusVariant(status: DeliveryStatus): 'green' | 'orange' | 'red' {
  if (status === 'delivered') return 'green';
  return status === 'no_listeners' ? 'orange' : 'red';
}

/** `emitCritical()` reads as "critical" — the producer waited on its listeners; `emit()` as "emit". */
export const methodLabel = (method: DeliveryMethod) => (method === 'emitCritical' ? 'critical' : 'emit');

/** `1 listener`, `2 listeners`, `no listeners`. */
export function listenersLabel(count: number): string {
  if (count === 0) return 'no listeners';
  return `${count} ${count === 1 ? 'listener' : 'listeners'}`;
}

/** A table size: `3.1 MB`. */
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
