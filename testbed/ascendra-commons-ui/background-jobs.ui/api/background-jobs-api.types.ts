/**
 * The wire shapes of `background-jobs.api` (ascendra-commons), by hand — dates arrive as ISO strings. One run is one
 * time a job took its lock: `findDueItems()`, then each item, failures isolated per item. A run that found the lock
 * taken isn't a run and isn't recorded.
 */
export type JobRunOutcome = 'completed' | 'job_failed';
export type JobRunTrigger = 'scheduled' | 'bootstrap' | 'manual';

export interface JobRun {
  /** A bigserial id, as a string. */
  id: string;
  jobName: string;
  trigger: JobRunTrigger;
  /** When the run started — what every screen filters, sorts and counts by. */
  startedAt: string;
  finishedAt: string;
  outcome: JobRunOutcome;
  itemsDue: number;
  itemsProcessed: number;
  itemsFailed: number;
  /** The job's `describeItem()` label for each failed item, up to 50. */
  failedItemRefs: string[];
  /** Set for `job_failed` — cut short in the list; `GET /jobs/runs/:id` has the whole stack. */
  error: string | null;
  /** Only manual runs carry one — the same id as the Run now request's audit record. */
  correlationId: string | null;
}

/** A job's expected gap between runs — declared by the app, or inferred from its scheduled runs. */
export interface JobCadence {
  source: 'declared' | 'inferred';
  seconds: number;
  /** e.g. `1 day`. */
  label: string;
}

/** `GET /jobs` — one row per job that ran, declares a cadence, or can be run now. */
export interface JobStatus {
  name: string;
  lastRun: JobRun | null;
  /** The most recent run with nothing failed. */
  lastSuccessAt: string | null;
  /** Failing runs in a row (job failed, or with failed items), read from the job's last 50 runs. */
  consecutiveFailures: number;
  cadence: JobCadence | null;
  overdue: boolean;
  /** e.g. `2 days`. */
  overdueBy: string | null;
  /** Whether `POST /jobs/:name/run` can run it — it's in the app's `jobs: […]`. */
  triggerable: boolean;
}

/** `GET /jobs/runs/summary` — the Overview's tiles over a period. A run is exactly one of clean / with failed items / job failed. */
export interface RunSummary {
  runs: number;
  clean: number;
  withFailedItems: number;
  jobFailed: number;
  manual: number;
  itemsProcessed: number;
  itemsFailed: number;
  /** Distinct jobs that ran. */
  jobs: number;
}

/** `GET /jobs/:name/failed-items` — an item ref recurring across a job's last 50 runs. */
export interface FailedItemSummary {
  itemRef: string;
  /** How many of those runs it failed in. */
  failureCount: number;
  lastFailedAt: string;
}

/** `GET /jobs/locks` — one lease-lock row. */
export interface JobLock {
  lockKey: string;
  jobName: string | null;
  /** `host#pid#nonce` — which process. */
  holder: string;
  acquiredAt: string;
  lockedUntil: string;
  /** `held` — a run in progress; `expired` — its holder died mid-run. */
  state: 'held' | 'expired';
}

export interface JobLocks {
  /** `false` on the session-level advisory lock — it leaves nothing to list. */
  supported: boolean;
  locks: JobLock[];
}

/**
 * `POST /jobs/:name/run` — 202 once the job has its lock; unknown job is a 404, already running a 409. The run goes on:
 * its result is the run that `GET /jobs/runs/trace/:correlationId` returns once it's recorded.
 */
export interface JobStarted {
  status: 'started';
  correlationId: string;
}

/** `GET /jobs/runs/volume` — the Volume & Retention screen. */
export interface RunVolume {
  /** The oldest stored run's start — how far back the history goes. `null` when it's empty. */
  oldestStartedAt: string | null;
  rowCount: number;
  /** The whole table, every application sharing it included. */
  tableSizeBytes: number | null;
  /** The past 30 calendar days in the requested zone, oldest first, zero-filled. */
  perDay: Array<{ day: string; runs: number; withFailedItems: number; jobFailed: number }>;
}
