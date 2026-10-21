# rate-limiting.ui

Admin/observability UI for `ascendra-commons`' `rate-limiting.api` — gated on
`rate-limit.view`, an ops/security persona (a rejection has no tenant, so there is
no tenant scoping). Built against `rate-limiting.api/mocks.html`.

## What a row is

The backend counts rejections in memory and writes every ~10 seconds, so the log
holds one row per **route, source, limit and minute** (plus correlation id), with a
count — "203.0.113.7 was turned away 280 times on `/pay/:token` in 09:40", not 280
rows. A row whose minute is still running keeps counting; new rejections arrive up
to ~10s late. `(overflow)` is the sources a wide flood spilled past the recorder's
buffer, counted together — its count is exact, its sources aren't
(`sourceLabel()` shows it as "Many sources (overflow)").

## Shipped

- **Overview** — the one nav.ts entry, the landing page. A period picker
  (`SegmentControl`: past hour / 24 hours / 7 days) drives three tiles
  (rejections, routes affected, busiest route with its share) and two ranked
  lists, styled as the showcase's Sales Rep Performance (accent top border and
  background, inline share bar) with the title and subtitle in the header row
  instead of column labels: **Rejections by route** (`GET …/catalog`, a share bar per route) and **Top
  sources** (`GET …/top-identifiers`, the 10 turned away most, with the routes each
  hit and when last seen) — two independent queries. Every row opens the list.
- **Volume & Retention** — a button on the Overview, like audit's Retention &
  Volume (`GET …/volume?tz`): oldest stored window, stored windows, table size, a
  "set by the app" retention tile, and rejections per day for the past 30 calendar
  days in the viewer's zone (a bar opens that day's list).
- **Rejections** — the log (`GET /rate-limits/rejections`), two query scenarios:
  Recent (no filters) and Advanced Filter (route select fed by the catalog, source,
  correlation ID, a required "Rejected between" range up to 90 days — AND logic). Columns: Minute,
  Route, Source, Rejections, Span, Limit, Correlation. Clicking a source filters the
  list to it; row actions filter by source / route and copy the source. No export —
  the API has none.
- **Request trace** — a sheet on the list, opened only from a row with a correlation
  id (`GET …/trace/:correlationId`); usually one item — a request, or a retry turned
  away again (counted 2).

## Decisions worth knowing about

**Every number links to the list it counted.** Tiles, route rows and source rows
pass the period as exact instants ending when they were fetched (`dataUpdatedAt`,
never render time); a chart bar passes its calendar day. Routes affected doesn't
link — it counts routes, and the list shows windows. Same pattern as
`audit-logging.ui`'s dashboard links.

**Span, not first/last seen.** `formatDateTime` has no seconds, and a span reads
better anyway: `<1s` is a script's burst, `56s` a steady drip.

**No trend badges on the tiles** (AUI-014 asks for one on a period-bound metric): the
API has no prior-period comparison, and the catalog takes only `since`. Add one when
an endpoint can answer "vs. the period before".

**Retention is the consuming app's.** The module never prunes on its own; the app
calls `pruneRejections()` from its scheduler (the sandbox keeps 90 days). The card's
oldest window shows the prune is running — the UI can't state the policy.

**`links.ts` hardcodes `/observability/rate-limiting`**, where `packages/observability`
mounts it — the same deferral as `audit-logging.ui`.

**No mock layer.** Every screen calls the real API (`ascendra-commons-sandbox`
drives real 429s through throttled demo routes — see its README, "The sample
data"). Sandbox data is recent only: the recorder stamps the real clock.

**Review (2026-10-21).** The module's guide and review report — what was fixed, the open gaps (a summary on the
list, alerting, the `payment-link-security` cross-reference, …) — live beside its backend:
`ascendra-commons/rate-limiting/GUIDE.md` and `AUDIT-REPORT.md`.

**Built by hand, not on a shared factory.** `audit-logging.ui`'s trace sheet and
list were the starting point; shared pieces get extracted once the small
observability modules are all built (rollout plan).
