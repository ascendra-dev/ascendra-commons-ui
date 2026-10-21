import { createCursorQueryFn } from '@/ascendra-ui';
import type { QueryFunctionMap } from '@/ascendra-ui';
import { rateLimitApi } from '../api/rate-limiting-api.client';
import type { RateLimitRejection } from '../api/rate-limiting-api.types';

const PAGE_SIZE = 50;

export const rateLimitQueryFunctions: QueryFunctionMap<RateLimitRejection> = {
  recent: createCursorQueryFn((params, cursor) => rateLimitApi.findRejections(params, PAGE_SIZE, cursor)),
  'advanced-filter': createCursorQueryFn((params, cursor) => rateLimitApi.findRejections(params, PAGE_SIZE, cursor)),
};
