import { createCursorQueryFn } from '@/ascendra-ui';
import type { QueryFunctionMap } from '@/ascendra-ui';
import { domainEventsApi } from '../api/domain-events-api.client';
import type { EventDelivery } from '../api/domain-events-api.types';

const PAGE_SIZE = 50;

export const domainEventsQueryFunctions: QueryFunctionMap<EventDelivery> = {
  recent: createCursorQueryFn((params, cursor) => domainEventsApi.findDeliveries(params, PAGE_SIZE, cursor)),
  'advanced-filter': createCursorQueryFn((params, cursor) => domainEventsApi.findDeliveries(params, PAGE_SIZE, cursor)),
};
