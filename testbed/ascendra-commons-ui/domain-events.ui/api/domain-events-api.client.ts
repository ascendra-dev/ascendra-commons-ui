import { api } from '@/ascendra-ui/lib/api';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, QueryParamValues } from '@/ascendra-ui';
import type {
  DeliverySummary,
  DeliveryVolume,
  EventCatalogEntry,
  EventDelivery,
  ListenerBinding,
} from './domain-events-api.types';

export const domainEventsApi = {
  /** GET /domain-events/deliveries — the filter form's params; `occurredRange` is one daterange field, two params on the wire. */
  findDeliveries(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<EventDelivery>> {
    const { occurredRange, ...filters } = params;
    const { from: since, before: until } = dateRangeBounds(occurredRange);
    return api.get<CursorListResponse<EventDelivery>>('/domain-events/deliveries', { ...filters, since, until, limit, cursor });
  },

  /** GET /domain-events/deliveries/trace/:correlationId — every delivery under one correlation id, oldest first. */
  trace(correlationId: string, query: { limit?: number; cursor?: string } = {}): Promise<CursorListResponse<EventDelivery>> {
    return api.get<CursorListResponse<EventDelivery>>(`/domain-events/deliveries/trace/${encodeURIComponent(correlationId)}`, query);
  },

  /** GET /domain-events/deliveries/summary — the tiles' totals since `since` (everything retained when omitted). */
  summary(since?: Date): Promise<DeliverySummary> {
    return api.get<DeliverySummary>('/domain-events/deliveries/summary', { since });
  },

  /** GET /domain-events/deliveries/catalog — per event name since `since` (everything retained when omitted). */
  catalog(since?: Date): Promise<EventCatalogEntry[]> {
    return api.get<EventCatalogEntry[]>('/domain-events/deliveries/catalog', { since });
  },

  /** GET /domain-events/listener-catalog — every listener binding the running app declares. */
  listeners(): Promise<ListenerBinding[]> {
    return api.get<ListenerBinding[]>('/domain-events/listener-catalog');
  },

  /** GET /domain-events/deliveries/volume — pass the viewer's IANA zone, so each day is a day on their calendar. */
  volume(timeZone?: string): Promise<DeliveryVolume> {
    return api.get<DeliveryVolume>('/domain-events/deliveries/volume', timeZone ? { tz: timeZone } : {});
  },
};
