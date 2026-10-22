import { api } from '@/ascendra-ui/lib/api';
import { dateRangeBounds } from '@/ascendra-ui';
import type { CursorListResponse, QueryParamValues } from '@/ascendra-ui';
import type {
  FailedItemSummary,
  JobLocks,
  JobRun,
  JobStarted,
  JobStatus,
  RunSummary,
  RunVolume,
} from './background-jobs-api.types';

const jobPath = (name: string) => `/jobs/${encodeURIComponent(name)}`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

  /**
   * Waits for a started run to be recorded — polls its trace every `intervalMs` until the row is there, then resolves
   * it; resolves `null` after `timeoutMs` (still running, or its process died mid-run and recorded nothing). A failed
   * poll is retried, not thrown: the run is under way regardless.
   */
  async waitForRun(correlationId: string, { intervalMs = 2_000, timeoutMs = 10 * 60_000 } = {}): Promise<JobRun | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await sleep(intervalMs);
      try {
        const page = await backgroundJobsApi.trace(correlationId, { limit: 1 });
        if (page.data.length > 0) return page.data[0];
      } catch {
        // A blip between polls — keep waiting.
      }
    }
    return null;
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

  /**
   * POST /jobs/:name/run — answers once the job has its lock, never after the run: follow it with `trace()` by the
   * returned correlation id. A 404 for a job that can't be run, a 409 while it's already running.
   */
  runNow(name: string): Promise<JobStarted> {
    return api.post<JobStarted>(`${jobPath(name)}/run`);
  },
};
