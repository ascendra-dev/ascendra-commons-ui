import { createCursorQueryFn } from '@/ascendra-ui';
import type { QueryFunctionMap } from '@/ascendra-ui';
import { notificationApi } from '../api/notification-api.client';
import type { Delivery, Suppression } from '../api/notification-api.types';

const PAGE_SIZE = 50;

export const deliveryQueryFunctions: QueryFunctionMap<Delivery> = {
  recent: createCursorQueryFn((params, cursor) => notificationApi.findDeliveries(params, PAGE_SIZE, cursor)),
  'advanced-filter': createCursorQueryFn((params, cursor) => notificationApi.findDeliveries(params, PAGE_SIZE, cursor)),
};

export const suppressionQueryFunctions: QueryFunctionMap<Suppression> = {
  all: createCursorQueryFn((_params, cursor) => notificationApi.suppressions(PAGE_SIZE, cursor)),
};
