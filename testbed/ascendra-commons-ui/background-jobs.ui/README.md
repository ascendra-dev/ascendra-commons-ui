# background-jobs.ui

Admin/observability UI for `ascendra-commons`' `background-jobs.api` — reads gated on `job.view`, Run now on `job.run`,
both platform personas (jobs have no tenant: one run covers every tenant's due items). Built against
`background-jobs.api/mocks.html`.

## What a row is

One **run**: one time a job took its lock — `findDueItems()`, then each item, failures isolated per item. Three
results: **clean**, **items failed** (`completed` with `itemsFailed > 0` — they stay due and retry next run) and **job
failed** (`findDueItems()` threw — nothing processed). A run that found the lock taken isn't a run and isn't recorded.

Every period is on when the run **started** (`startedAt`). The app keeps runs 90 days (the module's own
`job-run-pruner` job, scheduled by the app), so the filter's range stops there.

## Shipped

- **Overview** — the one nav.ts entry, the landing page. A period picker (`SegmentControl`: 24 hours / 7 days / 30
  days) drives three run tiles — Runs, With failed items (amber), Job failures (red) — each opening Runs on exactly
  what it counted (the period plus `hasFailedItems=true` or `outcome=job_failed`). A fourth tile, **Needs attention**,
  counts jobs, now — not runs — so it doesn't link; its panel is the breakdown. **Needs attention** (failing 2+ runs in
  a row, or overdue — `GET /jobs/alerts`'s rule applied to `GET /jobs` in the browser, failing first) and **Jobs**
  (everything else, by name), each row opening the Job screen. A footnote shows the oldest run kept. Header buttons:
  Volume & Retention, Locks, Go to Runs.
- **Runs** — every run of every job (`GET /jobs/runs`): Recent and Advanced Filter (job select fed by `/jobs`, outcome,
  trigger, failed items, correlation ID, a required "Started between" range up to 90 days — AND logic). Columns:
  Started, Job, Trigger, Outcome (a job failure's first error line on hover), Due, Processed, Failed, Took, Correlation.
  A row opens the Run sheet; the correlation id opens the Trace sheet; row actions filter by job / outcome and copy the
  id.
- **Run sheet** — one run, fetched by id (`GET /jobs/runs/:id`) for the whole error stack (the list's is cut short)
  and every failed item ref. A run pruned since the list loaded reads "no longer kept". Opened from Runs and from the
  Job screen.
- **Trace sheet** — from a run's correlation id (`GET /jobs/runs/trace/:id`), oldest first. Only manual runs carry an
  id: the Run now request's own, which is also its `job · triggered` audit record's.
- **Job** (`/jobs/:name`) — tiles (last run, last clean run, failing in a row — "50+" when the streak fills the 50 runs
  it's read from — and cadence, declared or inferred, amber when overdue, linking Locks when a dead holder's lock is
  left), **Failed items** (items failing in 2+ of its last 50 runs, `GET /jobs/:name/failed-items`) and **Recent runs**
  (its latest 20, opening the Run sheet). Header: All runs of this job, and **Run now** (`POST /jobs/:name/run`) — the API
  answers 202 once the job has its lock; a "running…" toast then follows the run by its correlation id
  (`waitForRun()`, polling its trace every 2s) and turns into the result — ran / items failed / couldn't find its
  work — refreshing every read; a second press while it runs is the 409's "running now". Disabled with "You don't have permission to run jobs" without `job.run`; absent, with a note,
  for a job the app can't trigger.
- **Locks** — `GET /jobs/locks`: held (a run in progress) or expired (its holder died mid-run). Read-only, no
  force-release. On the session-level advisory lock (`supported: false`) it says why nothing can be listed.
- **Volume & Retention** — `GET /jobs/runs/volume?tz`: oldest run, stored runs, table size, retention (90 days, linking
  the `job-run-pruner` job), and runs per day for 30 calendar days in the viewer's zone, stacked clean / with failed
  items / job failed (a bar opens that day's runs).

## Decisions worth knowing about

**Outcome is three-way in the UI, two-way on the wire.** The API's `outcome` is `completed | job_failed`; "items
failed" is `completed` + `hasFailedItems=true`. The list derives `result` per row (`toRunRow`) so the table's own
filter and search see the three, while the Advanced Filter keeps the API's two fields.

**Run now never waits on the run.** A job can outlast any proxy's timeout, so the request ends at "started" and the
screen follows the run in the history. The toast is the app-wide one, so the result still lands after the viewer leaves
the Job screen. After 10 minutes with no row it says to check Runs (still running) or Locks (its process died mid-run
and recorded nothing — the lock shows `expired`).

**Needs attention is computed in the browser** from `GET /jobs` with `/jobs/alerts`' rule (`needsAttention()` in
`display.ts`), so the tile, its panel and the Job screen agree without a second read.

**Retention shows 90 days, not a query result.** The module ships the pruner but the app decides whether and how to
schedule it; this console assumes the same 90 days its Runs filter stops at. The oldest run shows whether it's running.

**`links.ts` hardcodes `/observability/background-jobs`**, where `packages/observability` mounts it — the same deferral
as the other modules.

**No mock layer.** Every screen calls the real API (`ascendra-commons-sandbox` runs demo jobs through the real runner —
`src/demo/demo-jobs.ts`, `src/cli/job-history.ts`).

**Built by hand, not on a shared factory.** `domain-events.ui`'s overview, list, trace sheet and Volume & Retention, and
`idempotency-key.ui`'s detail sheet, were the starting points; shared pieces get extracted now that the small
observability modules are all built (rollout plan).
