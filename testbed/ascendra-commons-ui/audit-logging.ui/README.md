# audit-logging.ui

Admin/observability UI for `ascendra-commons`' `audit-logging.api`.

## Shipped

- **`AuditOverviewScreen`** — the one nav.ts entry, the module's landing
  page (`GET /audit/stats`). KPI tiles, a volume-by-day chart, top
  actions/actors — with buttons into the Audit Log list and Retention &
  Volume.
- **`AuditLogListScreen`** — the primary filterable feed (`GET /audit/events`).
  Two data-table-lab query scenarios: `Recent` (no filters) and `Advanced
  Filter` (every `AuditQuery` field combinable at once, not five
  mutually-exclusive presets — see hard-instructions.md AUI-006). Includes
  search highlighting, copy-to-clipboard on ids, and a CSV export button.
- **`AuditEventDetailScreen`** — one record plus its field-level diff, as a
  `Sheet` (not a page — see AUI-003). Reached only by clicking a row
  (`GET /audit/events/:id`).
- **`AuditEntityHistoryScreen`** / **`AuditTraceScreen`** ("Request / Job
  Trace") — both a timeline (`_audit-event-timeline.tsx`, shared page-level
  composition), reached only by clicking an entity or a correlation id.
  Fixed-filter drill-ins, not the full query system (see `create-table.md`'s
  decision tree).
- **`AuditActorActivityScreen`** (`GET /audit/actors/:actor/activity`) —
  reached only by clicking an actor. KV summary + by-action table.
- **`AuditRetentionScreen`** — reached via a button on the Overview screen.
  **Mock data only, always** — `GET /audit/retention` doesn't exist in
  `audit-logging.api` (marked "Proposed" in its own `mocks.html`); this
  screen has no real fetcher to default to, a consumer must supply
  placeholder `RetentionStats` explicitly.

## Not built (flagged, not silently dropped)

`mocks.html` also shows a **Coverage & Gaps** screen (`POST /audit/coverage`,
marked Live) — not built in this pass; needs an explicit yes/no before it's
either added or formally deferred.

## Decisions worth knowing about

**Cursor pagination bridged onto data-table-lab's batch model.**
`audit-logging.api` is keyset-paginated (forward-only cursor), but
data-table-lab's `QueryFn` takes a batch *number*. `queries/audit-query-functions.ts`
reconciles this by caching "the cursor to use for batch N" as the UI walks
forward — safe because `DataTableQueryProvider` only ever steps by exactly
±1 and resets to batch 1 on every param change, never jumps to an
unvisited batch. `totalBatches` is repurposed as a plain has-next-page
signal (`currentBatch+1` while there's a `nextCursor`, `currentBatch` once
there isn't), matching how `BatchNavigator` actually uses it.

**`links.ts` hardcodes `/audit-log` as the base path.** A per-vertical
configurable base is deferred until a second vertical actually needs a
different mount point.

**The api client bypasses `ascendra-ui`'s `api.get<T>` helper.** That helper
expects an `{ success, data, meta }` response envelope; `audit-logging.api`'s
NestJS controllers return the DTO directly as the response body. `api/audit-api.client.ts`
uses the raw `apiClient` axios instance instead. Worth resolving one way or
the other before more modules copy this same workaround.

**A consumer wiring a mock/override fetcher must do it from a Client
Component.** Every screen takes its data-fetching function as an optional
prop, defaulting to the real `api/` client. A function value can't cross the
React Server Component boundary — `testbed`'s own route files mark
themselves `"use client"` (and use `useParams()` instead of the awaited
`params` prop) for exactly this reason. A real vertical using the default
(real API) fetchers is unaffected.

**Timeline dots are colored by `entityType`, not module.** `mocks.html`'s own
Trace mock colors dots by *module* (payments/invoicing/notification),
illustrating a future unified cross-module trace `GET /audit/trace/:correlationId`
doesn't provide today (it only returns `audit-logging`'s own records — see
that endpoint's own README). `entityType` is the closest honestly-derivable
substitute; revisit if a real cross-module trace ships.

**Actor display name and `application` id are cross-repo gaps, not fixed
here.** The API only returns an actor *id*, no persona/display name; there's
also no `application` seam on the read side (other modules carry one per
`MODULE-STANDARD.md`). Both are `ascendra-commons` backend changes, out of
this repo's scope — documented, not implemented.

**Two `ascendra-ui` component gaps logged as `BACKLOG.md` suggestions, not
built here:** a relative-time-with-tooltip display, and a monospace/uuid
text component. Interim: `font-mono` classes applied inline. See this repo's
own `reference/ascendra-ui/hard-instructions.md` for the full list of
`ascendra-ui` usage corrections found while building this module.
