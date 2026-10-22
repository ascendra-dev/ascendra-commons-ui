import { createCursorQueryFn } from '@/ascendra-ui';
import type { QueryFunctionMap, QueryParamValues } from '@/ascendra-ui';
import { backgroundJobsApi } from '../api/background-jobs-api.client';
import { toRunRow, type JobRunRow } from './background-jobs-query-defs';

const PAGE_SIZE = 50;

const findRuns = async (params: QueryParamValues, cursor?: string) => {
  const page = await backgroundJobsApi.findRuns(params, PAGE_SIZE, cursor);
  return { ...page, data: page.data.map(toRunRow) };
};

export const backgroundJobsQueryFunctions: QueryFunctionMap<JobRunRow> = {
  recent: createCursorQueryFn(findRuns),
  'advanced-filter': createCursorQueryFn(findRuns),
};
