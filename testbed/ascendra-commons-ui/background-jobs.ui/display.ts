import type { JobCadence, JobRun, JobRunTrigger, JobStatus } from './api/background-jobs-api.types';

/** A run's result, three ways: the API's `completed` splits on whether any item failed. */
export type RunResult = 'clean' | 'items_failed' | 'job_failed';

export function runResult(run: Pick<JobRun, 'outcome' | 'itemsFailed'>): RunResult {
  if (run.outcome === 'job_failed') return 'job_failed';
  return run.itemsFailed > 0 ? 'items_failed' : 'clean';
}

const RESULT_LABELS: Record<RunResult, string> = { clean: 'clean', items_failed: 'items failed', job_failed: 'job failed' };

/** How a result reads: `items failed`, not `items_failed`. */
export const runResultLabel = (result: RunResult) => RESULT_LABELS[result];

/** Its badge colour: clean green, items failed amber (they retry next run), job failed red (nothing was processed). */
export function runResultVariant(result: RunResult): 'green' | 'orange' | 'red' {
  if (result === 'clean') return 'green';
  return result === 'items_failed' ? 'orange' : 'red';
}

/** Its timeline dot. */
export function runResultDot(result: RunResult): 'emerald' | 'amber' | 'red' {
  if (result === 'clean') return 'emerald';
  return result === 'items_failed' ? 'amber' : 'red';
}

/** `scheduled`, `bootstrap` (a boot's catch-up run) or `manual` (Run now). */
export const triggerLabel = (trigger: JobRunTrigger) => trigger;

/** How long a run took: `0.1s`, `28.1s`, `2m 05s`. */
export function runDuration(run: Pick<JobRun, 'startedAt' | 'finishedAt'>): string {
  const ms = Math.max(0, new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime());
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

/** The streak is read from a job's last 50 runs — 50 means "at least 50". */
export const STREAK_WINDOW = 50;

/** `3`, or `50+` when the streak fills the whole window. */
export const streakLabel = (n: number) => (n >= STREAK_WINDOW ? `${STREAK_WINDOW}+` : String(n));

/** `every 1 hour` (declared) or `~15 minutes (inferred)`; `no cadence` when neither. */
export function cadenceLabel(cadence: JobCadence | null): string {
  if (!cadence) return 'no cadence';
  return cadence.source === 'declared' ? `every ${cadence.label}` : `~${cadence.label} (inferred)`;
}

/**
 * `GET /jobs/alerts`'s rule, applied to `GET /jobs` in the browser: overdue, or 2+ failing runs in a row. The Overview's
 * Needs attention tile, its panel and the Job screen all use it, so they agree.
 */
export const ALERT_CONSECUTIVE_FAILURES = 2;
export const needsAttention = (job: JobStatus) => job.overdue || job.consecutiveFailures >= ALERT_CONSECUTIVE_FAILURES;

export type JobHealthKey = 'failing' | 'items_failing' | 'overdue' | 'never_run' | 'last_failed' | 'manual' | 'healthy';

/** A job's one-badge health — failing (red) before overdue (amber); healthy last. */
export function jobHealth(job: JobStatus): { key: JobHealthKey; label: string; variant: 'red' | 'orange' | 'blue' | 'green' } {
  const streak = streakLabel(job.consecutiveFailures);
  if (job.consecutiveFailures >= ALERT_CONSECUTIVE_FAILURES) {
    return job.lastRun?.outcome === 'job_failed'
      ? { key: 'failing', label: `failed ${streak} runs in a row`, variant: 'red' }
      : { key: 'items_failing', label: `failed items ${streak} runs in a row`, variant: 'red' };
  }
  if (job.overdue) {
    return job.lastRun
      ? { key: 'overdue', label: `overdue by ${job.overdueBy}`, variant: 'orange' }
      : { key: 'never_run', label: 'never run', variant: 'orange' };
  }
  if (job.lastRun && runResult(job.lastRun) !== 'clean') return { key: 'last_failed', label: 'last run failed', variant: 'orange' };
  if (!job.cadence) return { key: 'manual', label: 'manual only', variant: 'blue' };
  return { key: 'healthy', label: 'healthy', variant: 'green' };
}

/** A table size: `3.1 MB`. */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}
