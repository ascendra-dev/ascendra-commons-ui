# idempotency-key.ui

Admin/observability UI for `ascendra-commons`' `idempotency-key.api` — gated on
`idempotency.view` (support/ops persona); the saved response body needs
`idempotency.view-response` on top. Built against `idempotency-key.api/mocks.html`.

## What a row is

One **claim**: a request that carried an `Idempotency-Key`, per (scope, key). It
records the route, status, saved status code and response size, and counts what
came after it — **replays** (a retry got the saved response back) and **409s** (a
retry arrived while the first was still running). The backend counts those in
memory and writes every ~10 seconds, so a count can be up to ~10s behind.

Two counts mean something went wrong: **reclaimed** (a pending claim went stale
and another request took it over — possibly ran twice) and **ran twice** (the
original finished after being taken over; its result was discarded — confirmed).

The store keeps claims **24 hours** (the app's cleanup), so the Overview's periods
stop there and the filter's range looks back two days at most.

## Shipped

- **Overview** — the one nav.ts entry, the landing page. A period picker
  (`SegmentControl`: past hour / 24 hours) drives four tiles — Claims (completed ·
  in progress), Duplicates absorbed (replayed · 409s), Reclaimed (orange), Ran
  twice (red) — and **Duplicates by endpoint** (`GET …/routes`, a share bar per
  route, ran-twice badge). **In progress** (`status=pending`) isn't period-bound:
  every unfinished claim, an orange age badge past a minute. A footnote shows the
  oldest claim kept.
- **Claims** — the list (`GET /idempotency-keys`), three query scenarios: Recent,
  In Progress, and Advanced Filter (status, route select fed by the per-route
  counts, scope, correlation ID, a required "Created between" range up to 2 days —
  AND logic). Columns: Created, Route, Key, Scope, Status · code, Replayed, 409s,
  Safety, Correlation. Row actions filter by route / scope and copy the key.
- **Claim sheet** — from a key in the list or an In progress row. Everything on the
  claim; **Saved response** shows code and size, and the body only on Show
  (`GET …/:scope/:key/response`). Without `idempotency.view-response` the 403 reads
  as a note, not an error. The correlation id only copies — no sheet on a sheet.
- **Request trace** — a sheet on the list, from a row's correlation id
  (`GET …/trace/:correlationId`): every claim raised under it, as a timeline.

## Decisions worth knowing about

**Only the Claims tile and endpoint rows link.** They pass the period as exact
instants ending when they were fetched (`dataUpdatedAt`), so the list adds up to the
number. The API can't filter to "has duplicates" or "was reclaimed", so those tiles
don't link — a list that doesn't add up to its number is worse than none.

**The body is never in a list or claim read.** Claim records carry `statusCode` and
`responseBytes` only; the body can hold personal data, so it has its own endpoint and
action, fetched only on request.

**"Long running" is a rough line (60s).** The API doesn't report the app's
`staleAfterSeconds`, so the In progress badge can't say "stale" — only "old".

**No trend badges, no export** — the API has no prior-period comparison and no
export, same as `rate-limiting.ui`.

**`links.ts` hardcodes `/observability/idempotency`**, where `packages/observability`
mounts it — the same deferral as the other modules.

**No mock layer.** Every screen calls the real API (`ascendra-commons-sandbox`
drives real claims through its idempotent demo routes — see its README). The seed
ages out after 24 hours; re-run it before reviewing.

**Review (2026-10-22).** The module's guide and review report — what was fixed, the open gaps (redacting the saved
body, filters behind the three unlinked tiles, alerting on "ran twice", the stale window on screen, …) — live beside its
backend: `ascendra-commons/idempotency-key/GUIDE.md` and `AUDIT-REPORT.md`.

**Built by hand, not on a shared factory.** `rate-limiting.ui`'s overview and
trace sheet were the starting point; shared pieces get extracted once the small
observability modules are all built (rollout plan).
