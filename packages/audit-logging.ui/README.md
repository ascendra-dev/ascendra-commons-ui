# audit-logging.ui

Admin/observability UI for `ascendra-commons`' `audit-logging.api`.

## Shipped

- **`AuditLogListScreen`** — the one nav.ts entry. Full data-table-lab query
  system (`Recent`, `By Entity`, `By Actor & Action`, `By Date Range`, `By
  Correlation ID`), matching `GET /audit/events`' filter set.
- **`AuditEventDetailScreen`** — one record plus its field-level diff.
  Reached only by clicking an event id (`GET /audit/events/:id`).
- **`AuditEntityHistoryScreen`** — every change to one entity. Reached only
  by clicking an entity (`GET /audit/entities/:type/:id/history`). A Simple
  Table, not the full query system — the filter is fixed by the click, not
  user-editable (see `create-table.md`'s decision tree in `ascendra-ui`).
- **`AuditTraceScreen`** — every audited step under one correlation id
  (`GET /audit/trace/:correlationId`). Same Simple Table tier as entity
  history, same reasoning.

## Deferred (real scope decisions, not oversights)

`audit-logging.api` also ships `GET /audit/actors/:actor/activity`, `GET
/audit/stats`, and `POST /audit/coverage` — an Actor Activity screen, an
Overview/stats dashboard, and a Coverage & Gaps screen. Not built in this
pass; Phase 1's committed scope was list → detail, entity → history (the
plan's worked example). Revisit if a real user asks for them.

## Two decisions worth knowing about

**Cursor pagination bridged onto data-table-lab's batch model.**
`audit-logging.api` is keyset-paginated (forward-only cursor), but
data-table-lab's `QueryFn` takes a batch *number*. `queries/audit-query-functions.ts`
reconciles this by caching "the cursor to use for batch N" as the UI walks
forward — safe because `DataTableQueryProvider` only ever steps by exactly
±1 and resets to batch 1 on every param change, never jumps to an
unvisited batch. `totalBatches` is repurposed as a plain has-next-page
signal (`currentBatch+1` while there's a `nextCursor`, `currentBatch` once
there isn't), matching how `BatchNavigator` actually uses it. See the
function's own doc comment for the full reasoning.

**`links.ts` hardcodes `/audit-log` as the base path.** The original rollout
plan mentioned remounting a module at a different base path per vertical;
building that (a base-path parameter every consumer must thread through) is
deferred until a second vertical actually needs a different mount point —
one real consumer doesn't justify the extra indirection yet.

**The api client bypasses `ascendra-ui`'s `api.get<T>` helper.** That helper
expects an `{ success, data, meta }` response envelope; `audit-logging.api`'s
NestJS controllers return the DTO directly as the response body (verified
against the controller source, and no response-wrapping interceptor exists
in `ascendra-commons` or `ascendra-pay-api` today). `api/audit-api.client.ts`
uses the raw `apiClient` axios instance instead. Worth resolving one way or
the other before more modules copy this same workaround.

**A consumer wiring a mock/override fetcher must do it from a Client
Component.** Every screen here takes its data-fetching function as an
optional prop (`queryFunctions`, `fetchDetail`, `fetchHistory`, `fetchTrace`)
defaulting to the real `api/` client, so a consumer can swap in a
mock/override for local dev without touching the module. But a function
value can't cross the React Server Component boundary — a Server Component
page passing an override into one of these ("use client") screens fails at
build time ("Functions cannot be passed directly to Client Components").
`testbed`'s own route files mark themselves `"use client"` (and use
`useParams()` instead of the awaited `params` prop) for exactly this reason.
A real vertical using the default (real API) fetchers is unaffected — no
function crosses the boundary when a Server Component renders a screen with
no override prop at all.
