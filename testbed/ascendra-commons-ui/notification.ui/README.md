# notification.ui

The notification console for `ascendra-commons`' `notification.api` — did it send, and if not, why; and the
configuration that decides how each type goes out. Built against `notification.api/mocks.html`.

Like the access console it has its own shell — the app links to `/notifications` (`packages/notifications` in
distribution, `testbed/app/notifications` here) with its own sidebar (`notificationNav`). "Platform" is the API's own
default (`isPlatformAdmin`: an actor with no tenant) — platform staff see every tenant's rows; a tenant admin its own,
and the screens don't offer the rest.

## Shipped

- **Overview** — over the past 24 hours, 7 or 30 days (a platform admin picks a tenant): tiles for sends, reached,
  failed, skipped and config gaps; **By channel** (reached · waiting · failed · skipped, the worst in red); **Why sends
  failed** (by reason, with the kind of fix — config, recipient, transient, skipped); **By type** (failure rate, worst
  first); **Configuration health** (coverage gaps, and leftover routes for undeclared types); **Sends per day** (failed
  on top). Each count opens Deliveries filtered to exactly what it counted (`?reason=` for a reason).
- **Volume & retention** — platform admins: rows, rows still holding the message, table size, rows per day over 30
  days; the app states its own retention under the chart.
- **Notification types** — what the app sends, grouped by audience, each with its default channels and what's notable:
  tenant routes, white-labelled templates, gaps, required (can't be turned off), leftovers nothing declares.
- **Type page** — Routing (the default and each tenant's; edit, add a tenant's own, remove it to use the default),
  Templates per routed channel (default and each tenant's own; WhatsApp is the provider's; missing ones flagged),
  Variables with samples, Coverage (each gap links to the sends it failed). The defaults are the platform's; a tenant
  admin edits its own. A platform admin picks a tenant to act for it.
- **Template editor** — subject (title for in-app; none for SMS), body, HTML for email; a variable palette inserts at
  the cursor; the preview renders with the type's samples as you type, and a variable the type doesn't have blocks Save.
  A tenant's own text starts from the default; Delete goes back to it.
- **Test send** — to yourself, a colleague (a platform admin: any user or an address, and whose configuration), the
  type's samples editable; the result per channel, and a link to the test sends in the log.
- **Provider accounts** — a grid of tenants × channels (in-app needs none): own, the platform's (the fallback), or
  missing; Verify asks the provider (verified / rejected with its reason / can't check — this session's answer); Set or
  Replace takes the provider's own JSON, saves and verifies; Remove sends a tenant back to the platform's account. A
  tenant admin sees its own row and the platform's read-only.
- **Suppressions** — every entry that skips the viewer's sends (it applies app-wide), with its bounces, when, who filed
  it and the sends to it; Remove (audited, confirmed) for one the viewer's tenant filed — the platform's otherwise.
- **Deliveries** — every send attempt, one row per channel, newest first; test sends hidden unless asked for. Recent;
  Advanced Filter by type, channel, status, reason, tenant (platform), a user, a guest's address (hashed by the API — the log
  never stores it), a recipient key, correlation id and a required range up to 90 days. The status reads in plain words
  beside its badge (`reasonLabel`); a delivery a later one retried is marked "retried".
- **Delivery sheet** — what happened when (a retry of…, the attempt, the provider's callback, retried → …; a linked
  delivery opens in place), the recipient, provider id and correlation, and the message — `notification.view_content`,
  loaded only when asked (every read is audited); a send that failed before it rendered shows its kept variables.
  **Retry** (`notification.retry`) for a failed or bounced send to a user with its variables kept — once; the confirm
  warns when the failure wasn't transient. **Everything to …** filters the list to the recipient.

## Everyone's

- **The bell** (`NotificationBell`, for the app's top bar — pass `enabled` when someone is signed in): the unread count
  (polled every 30 s — no push yet) and the last five messages; opening it marks nothing read, clicking a message does;
  Mark all read; See all; Notification settings. No bell when the app has no inbox.
- **My inbox** — Unread / All, newest first, a page at a time; clicking a message marks it read; Mark all read.
- **My notifications** — every type routed to the user, on its channels, a switch each, and "every notification" per
  channel; the most specific rule wins; a required type is always on. Saves as you switch.

The console's layout lets anyone signed in reach these two; its admin screens need `notification.view`.

## Shape

`api/` (client + wire types), `bell.tsx`, `display.ts` (channel labels, status colours, reason words, recipient helpers, the retry
rules), `queries/` (QueryDefs, field options, columns, query functions), `links.ts`, `nav.ts`.
