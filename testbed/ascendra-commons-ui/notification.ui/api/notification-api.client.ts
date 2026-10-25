import { api } from '@/ascendra-ui/lib/api';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, QueryParamValues } from '@/ascendra-ui';
import type { Delivery, DeliveryContent, NotificationTypeSummary, SendResult } from './notification-api.types';

const enc = encodeURIComponent;

/** The filter form's fields → the API's: a user is keyed `user:<id>`; a guest's address is hashed by the API. */
function deliveryFilters(params: QueryParamValues) {
  const { attemptedRange, user, address, recipientKey, test, ...rest } = params;
  const { from: since, before: until } = dateRangeBounds(attemptedRange);
  return {
    ...rest,
    ...(user ? { recipientKey: `user:${String(user).trim()}` } : recipientKey ? { recipientKey } : {}),
    ...(address ? { recipientAddress: String(address).trim() } : {}),
    // Test sends are hidden unless asked for: 'only' → test sends, 'both' → no filter.
    ...(test === 'both' ? {} : { test: test === 'only' ? 'true' : 'false' }),
    since,
    until,
  };
}

export const notificationApi = {
  /** GET /notifications/deliveries — newest first, keyset-paginated; tenant-scoped by the API. */
  findDeliveries(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<Delivery>> {
    return api.get<CursorListResponse<Delivery>>('/notifications/deliveries', { ...deliveryFilters(params), limit, cursor });
  },

  delivery(id: string): Promise<Delivery> {
    return api.get<Delivery>(`/notifications/deliveries/${enc(id)}`);
  },

  /** The stored message — `notification.view_content`; every read is audited, so only on request. */
  deliveryContent(id: string): Promise<DeliveryContent> {
    return api.get<DeliveryContent>(`/notifications/deliveries/${enc(id)}/content`);
  },

  /** GET /notifications/types — the declared types with their default channels, templates and gap counts. */
  types(): Promise<NotificationTypeSummary[]> {
    return api.get<NotificationTypeSummary[]>('/notifications/types');
  },

  /** Resend a failed delivery to its user, on its channel — once; the new row links back. */
  retry(id: string): Promise<SendResult> {
    return api.post<SendResult>(`/notifications/deliveries/${enc(id)}/retry`, {});
  },
};
