# domain-events.ui

Admin/observability UI for `ascendra-commons`' `domain-events.api` — gated on `domain-events.view`, a platform persona
(a delivery has no tenant: the payload isn't stored, and the wiring is the whole app's). Built against
`domain-events.api/mocks.html`.

## What a row is

One **delivery**: one `emit()` / `emitCritical()` call, as the transport saw it — the event name, how it was raised,
how many listeners were subscribed, and whether the hand-off happened (`delivered`, `no_listeners`,
`dispatch_failed`). **Delivery only**: never what a listener then did (audit's and notification's own logs say that),
never the payload. The recorder buffers in memory and writes every ~10 seconds, so a delivery can appear up to ~10s late.

Every period is on when the event **occurred** (`occurredAt`). The app keeps deliveries 90 days (its prune), so the
filter's range stops there.

## Shipped

- **Overview** — the one nav.ts entry, the landing page. A period picker (`SegmentControl`: 24 hours / 7 days / 30
  days) drives four tiles — Deliveries, No listeners (amber), Dispatch failed (red), Critical (`emitCritical()`) — each
  opening Deliveries on exactly what it counted (the period plus `status` or `method`). **Busiest events** (the period's
  catalog, a share bar per event) and **Wiring problems** (the Wiring screen's three checks, counted; never-fires over
  everything retained). A footnote shows the oldest delivery kept. Header buttons: Volume & Retention, Wiring, Go to
  Deliveries.
- **Deliveries** — the log (`GET /domain-events/deliveries`): Recent and Advanced Filter (event select fed by the
  catalog, raised with, status, correlation ID, a required "Occurred between" range up to 90 days — AND logic). Columns:
  Occurred, Event, Raised with, Listeners, Status (a dispatch failure's reason on hover), Correlation. An event name
  filters to it; row actions filter by event / status and copy the correlation id.
- **Request trace** — a sheet on the list, from a row's correlation id (`GET …/trace/:correlationId`), oldest first. A
  checkout shows `payment.captured` then `invoice.paid`.
- **Wiring** — what fired (`GET …/catalog?since`) against what the code says listens (`GET …/listener-catalog`), one row
  per event name in either, joined in the browser (`wiring.ts`). Three checks: **critical listener, raised with
  `emit()`** (red — that listener's failure is swallowed), **fires into nothing** (amber), **never fires** (blue).
  Problems sort first; "Problems only" filters to them. Period: 7 days / 30 days / all retained (the default — a quiet
  week isn't dead code).
- **Volume & Retention** — `GET …/volume?tz`: oldest delivery, stored deliveries, table size, a "set by the app"
  retention tile, and deliveries per day for 30 calendar days in the viewer's zone, stacked delivered / no listeners /
  dispatch failed (a bar opens that day's list).

## Decisions worth knowing about

**Every tile links.** Unlike idempotency's, every Overview number here is something the list can filter to — status
and method are list filters — so each opens the list on exactly the instants it was counted over (`dataUpdatedAt`).

**Wiring is joined in the browser.** The two reads stay separate on the API (the listener catalogue is live, the
delivery catalog is history); `wiringRows()` joins them, so the Overview and the Wiring screen agree on what a problem
is.

**Dispatch failed is rare by design.** A listener that throws is a listener failure — logged by the emitter, owned by the
listener's module — not a dispatch failure. Expect 0.

**Audit's deliveries have no correlation id.** audit-logging passes its id through request context, not `emit()`'s third
argument, so its rows don't open a trace (see the module's AUDIT-REPORT).

**`links.ts` hardcodes `/observability/domain-events`**, where `packages/observability` mounts it — the same deferral as
the other modules.

**No mock layer.** Every screen calls the real API (`ascendra-commons-sandbox` raises demo events through the real
emitter — `src/demo/demo-events.ts`, `src/cli/domain-event-history.ts`).

**Review (2026-10-22).** The module's guide and review report — what was fixed, the open gaps (a correlation-id
resolver so audit's events trace, alerting on wiring problems, a rollup for the catalog at scale, …) — live beside its
backend: `ascendra-commons/domain-events/GUIDE.md` and `AUDIT-REPORT.md`.

**Built by hand, not on a shared factory.** `rate-limiting.ui`'s overview, list and Volume & Retention, and
`idempotency-key.ui`'s trace sheet, were the starting points; shared pieces get extracted once the small observability
modules are all built (rollout plan).
