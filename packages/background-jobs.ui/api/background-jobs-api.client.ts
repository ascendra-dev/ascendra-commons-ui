import { api } from '@/ascendra-ui/lib/api';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, QueryParamValues } from '@/ascendra-ui';
import type {
  FailedItemSummary,
  JobLocks,
  JobRun,
  JobStatus,
  JobTriggerResult,
  RunSummary,
  RunVolume,
} from './background-jobs-api.types';

const jobPath = (name: string) => `/jobs/${encodeURIComponent(name)}`;

export const backgroundJobsApi = {
  /** GET /jobs — every job's status, by name. */
  jobs(): Promise<JobStatus[]> {
    return api.get<JobStatus[]>('/jobs');
  },

  /** GET /jobs/runs — the filter form's params; `startedRange` is one daterange field, two params on the wire. */
  findRuns(params: QueryParamValues, limit: number, cursor?: string): Promise<CursorListResponse<JobRun>> {
    const { startedRange, ...filters } = params;
    const { from: since, before: until } = dateRangeBounds(startedRange);
    return api.get<CursorListResponse<JobRun>>('/jobs/runs', { ...filters, since, until, limit, cursor });
  },

  /** GET /jobs/runs?jobName= — one job's latest runs, newest first. */
  recentRuns(jobName: string, limit: number): Promise<CursorListResponse<JobRun>> {
    return api.get<CursorListResponse<JobRun>>('/jobs/runs', { jobName, limit });
  },

  /** GET /jobs/runs/:id — one run with its whole error stack; a 404 once it's pruned. */
  run(id: string): Promise<JobRun> {
    return api.get<JobRun>(`/jobs/runs/${encodeURIComponent(id)}`);
  },

  /** GET /jobs/runs/trace/:correlationId — every run under one correlation id, oldest first. */
  trace(correlationId: string, query: { limit?: number; cursor?: string } = {}): Promise<CursorListResponse<JobRun>> {
    return api.get<CursorListResponse<JobRun>>(`/jobs/runs/trace/${encodeURIComponent(correlationId)}`, query);
  },

  /** GET /jobs/runs/summary — the tiles' totals since `since` (everything retained when omitted). */
  summary(since?: Date): Promise<RunSummary> {
    return api.get<RunSummary>('/jobs/runs/summary', { since });
  },

  /** GET /jobs/runs/volume — pass the viewer's IANA zone, so each day is a day on their calendar. */
  volume(timeZone?: string): Promise<RunVolume> {
    return api.get<RunVolume>('/jobs/runs/volume', timeZone ? { tz: timeZone } : {});
  },

  /** GET /jobs/:name/failed-items — items failing in 2+ of the job's last 50 runs. */
  failedItems(name: string): Promise<FailedItemSummary[]> {
    return api.get<FailedItemSummary[]>(`${jobPath(name)}/failed-items`);
  },

  /** GET /jobs/locks — the lease lock's rows, held or left behind. */
  locks(): Promise<JobLocks> {
    return api.get<JobLocks>('/jobs/locks');
  },

  /** POST /jobs/:name/run — runs it and waits; a 404 for a job that can't be run, a 409 while it's already running. */
  runNow(name: string): Promise<JobTriggerResult> {
    return api.post<JobTriggerResult>(`${jobPath(name)}/run`);
  },
};
