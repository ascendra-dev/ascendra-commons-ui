# audit-logging.ui

Admin/observability UI for `ascendra-commons`' `audit-logging.api`.

## Shipped

- **Overview** — the one nav.ts entry, the module's landing page. Four KPI
  tiles (records in the past 24 hours / 7 days, distinct actors / entity
  types in the past 30 days — each with its change vs. the equal period
  before, or "new" when that period was empty), a volume-by-day chart (past
  30 days), and a "Top actions" table ranked by (entity type, action) —
  `Entity | Action | Count | Actors` — with buttons into the Audit Log list
  and Retention & Volume. **Two independent queries**, one per endpoint:
  `auditApi.overviewStats()` (`GET /audit/stats/overview` — KPIs + chart) and
  `auditApi.topActions()` (`GET /audit/stats/top-actions`), so a slow table
  never holds back the KPIs and vice versa.
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
- **Retention & Volume** — reached via a button on the Overview screen
  (`GET /audit/retention`): oldest record, records, table size (a whole-table
  figure — "—" for a tenant admin) and a "kept indefinitely" tile
  (`audit-logging` has no retention policy), plus a volume-by-month chart.
  Read-only.

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

**`links.ts` hardcodes `/observability/audit` as the base path** — where
`packages/observability` mounts it. A per-vertical configurable base is
deferred until a second vertical actually needs a different mount point.

**No mock layer.** Every screen calls the real API through `api/` (via
`ascendra-ui`'s `api` helper, which sends the session's bearer token).
Develop against `ascendra-commons-sandbox`, which runs `audit-logging` for
real with generated history — see `testbed/.env.example`.

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
text component. Interim: `font-mono` classes applied inline. See
`ascendra-framework/reference/ascendra-ui/hard-instructions.md` for the full
list of `ascendra-ui` usage corrections found while building this module.
