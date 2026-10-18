# audit-logging.ui

Admin/observability UI for `ascendra-commons`' `audit-logging.api`.

## Shipped

- **`AuditOverviewScreen`** — the one nav.ts entry, the module's landing
  page. Four KPI tiles (each with a `SimpleBadge` trend/delta vs. its prior
  equivalent period — today vs. yesterday, the 7d/30d tiles vs. their own
  prior window), a volume-by-day chart (past 30 days, explicit date range in
  the subtitle), and one merged "Top actions" table (`Action | Count |
  Actors`, matching `audit-logging.api/mocks.html`'s Overview section
  exactly rather than splitting actions and actors into two tables) — with
  buttons into the Audit Log list and Retention & Volume. Loads as **two
  independent queries**, not one: `mockOverviewStats()` (KPI row + volume
  chart) and `mockTopActionsStats()` (the table), each with its own
  simulated delay, so a slow table never blocks the fast KPIs from showing
  and vice versa. The real API is still proposed as one `GET /audit/stats`
  endpoint (`audit-logging.api/mocks.html`) — this split is mock-layer-only
  for now; see `AuditOverviewStats`/`AuditTopActionsStats`'s doc comments in
  `api/audit-api.types.ts` for what changes when `ascendra-commons` is
  updated to match.
- **`AuditLogListScreen`** — the primary filterable feed (`GET /audit/events`).
  Two data-table-lab query scenarios: `Recent` (no filters) and `Advanced
  Filter` (every `AuditQuery` field combinable at once, not five
  mutually-exclusive presets — see hard-instructions.md AUI-006). Includes
  search highlighting, copy-to-clipboard on ids, and a CSV export button.
- **`AuditEventDetailScreen`** — one record plus its field-level diff, as a
  `Sheet` (not a page — see AUI-003). Reached only by clicking a row
  (`GET /audit/events/:id`).
- **Actor activity / Entity history / Request / Job trace** — three read-only
  sheets on the list (not pages), opened by clicking an actor, an entity id or
  a correlation id — beside the list page in `events/`, like the record
  detail sheet: `_audit-actor-activity-sheet.tsx`
  (`GET /audit/actors/:actor/activity` — summary + by-action SimpleTable),
  `_audit-entity-history-sheet.tsx` (`GET /audit/entities/:type/:id/history`)
  and `_audit-trace-sheet.tsx` (`GET /audit/trace/:correlationId`). The two
  timelines load older events by cursor, have no links inside (ids copy) and
  are separate files on purpose — they're expected to diverge.
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

**Timeline dots are colored by the action's meaning** (`dotVariantForAction`
in `shared/timeline`), the same in both timeline sheets: by the *words* in the
verb, so any app's actions color with no setup — a removal or ending (`voided`,
`role_revoked`) rose, a failure (`payment_failed`) amber, a creation or addition
(`created`, `uploaded`) emerald, anything else (`issued`, `paid`) sky. `mocks.html`'s
own Trace mock colors by *module*, for a future cross-module trace the API
doesn't provide today; each trace event shows its entity instead.

**Actor display name is a cross-repo gap, not fixed here.** The API only
returns an actor *id*, no persona/display name — an `ascendra-commons`
backend change, out of this repo's scope. (`application` is no longer a gap:
every record carries it, shown as the list's optional Application column and
on the record sheet.)

**Two `ascendra-ui` component gaps logged as `BACKLOG.md` suggestions, not
built here:** a relative-time-with-tooltip display, and a monospace/uuid
text component. Interim: `font-mono` classes applied inline. See this repo's
own `reference/ascendra-ui/hard-instructions.md` for the full list of
`ascendra-ui` usage corrections found while building this module.
