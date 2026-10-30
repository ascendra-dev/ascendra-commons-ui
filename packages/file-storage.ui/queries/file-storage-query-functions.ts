import { createCursorQueryFn } from '@/ascendra-ui';
import type { QueryFunctionMap } from '@/ascendra-ui';
import { fileStorageApi } from '../api/file-storage-api.client';
import type { FileRow, RejectionRow } from '../api/file-storage-api.types';

const PAGE_SIZE = 50;

export const fileQueryFunctions: QueryFunctionMap<FileRow> = {
  recent: createCursorQueryFn((params, cursor) => fileStorageApi.findFiles(params, PAGE_SIZE, cursor)),
  held: createCursorQueryFn((params, cursor) => fileStorageApi.findFiles({ ...params, held: 'held' }, PAGE_SIZE, cursor)),
  'advanced-filter': createCursorQueryFn((params, cursor) => fileStorageApi.findFiles(params, PAGE_SIZE, cursor)),
};

export const rejectionQueryFunctions: QueryFunctionMap<RejectionRow> = {
  recent: createCursorQueryFn((params, cursor) => fileStorageApi.findRejections(params, PAGE_SIZE, cursor)),
  'advanced-filter': createCursorQueryFn((params, cursor) => fileStorageApi.findRejections(params, PAGE_SIZE, cursor)),
};
