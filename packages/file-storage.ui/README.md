# file-storage.ui

The file console for `ascendra-commons`' `file-storage.api` — every file the app holds, what it is, whose, how long
it's kept, who opened it, the rules uploads must pass, and what can be cleaned up. Built against
`file-storage.api/mocks.html`.

Like the notification console it has its own shell — the app links to `/files` (`packages/files` in distribution,
`testbed/app/files` here) with its own sidebar (`fileStorageNav`). "Platform" is the API's own default
(`isPlatformAdmin`: an actor with no tenant) — platform staff see every tenant's files and pick one in the header; a
tenant admin sees its own, and the screens don't offer the rest. Every screen needs `file.view`.

## Shipped

- **Overview** — over the past 7, 30 or 90 days: tiles for uploaded, refused, stored now, unscanned and on legal hold;
  **Uploads per day** (refused on top; a day opens its files); **By upload type** (uploaded · size · refused — a key
  the app doesn't declare and a retired type say so); **Why uploads were refused**; **Storage** against each limit
  (the fullest in red); **Needs attention** — past their date, expiring in 30 days, orphans, duplicates, stray blobs
  (platform), held past their date. Each count opens the list filtered to exactly what it counted.
- **Files** — every stored file, newest first; Recent, On legal hold, and an Advanced Filter (filename, upload type,
  tenant, uploader, minimum size, hold, scan, uploaded between). "not scanned", "held" (with the date it passed), and
  "orphan" read in the row.
- **File sheet** — what it is, kept until (fixed at upload), the scan, the hash; what it's attached to (Detach); who
  opened it (a person, or a shared link). **Open** (`file.view_content` — a short-lived link, access-logged and
  audited), **Place / Release legal hold** (`file.hold`, a reason required), **Delete** (`file.delete`) — off while
  held, and for a tenant admin before the retention date, with the reason shown; a platform admin's early delete is an
  erasure and asks why (the audit log keeps it). A deleted file says so.
- **Upload types** — what each accepts, its size, how long it's kept, what happens to a file the scanner can't read,
  how much of it there is. Tightened, off for the tenant, off for everyone.
- **Upload type page** — the app's rule beside the tenant's own; **Edit** offers only narrowing (content types and
  extensions from the app's list, a smaller size, refuse an unscannable file) and names a loosening before the API
  does; turn off / back on (for the tenant — or, a platform admin with no tenant picked, for everyone); go back to
  the app's rules. `file.category.manage`.
- **Refused uploads** — every refused attempt, newest first: the reason badge and plain words (the API's own message
  on hover); filter by why, upload type, tenant and when.
- **Storage & limits** — per tenant: files, bytes, limit (and how full); a row shows its bytes by upload type. Set,
  change or remove a limit (`file.quota.manage`, platform admins); a limit under what a tenant uses warns first.
- **Cleanup** — three tabs. **Orphaned files** (a row opens the file; **Purge** previews what goes and what stays —
  held, inside its retention date — before anything goes). **Duplicates** (most wasted first; the copies open their
  files — reported, never merged). **Stray blobs** (platform; per bucket, read a page at a time; delete re-checks).
- **Volume & retention** — files, expiring in 30 days, past their date, kept indefinitely, held; both logs' rows and
  how long they're kept; the retention job's last run (from background-jobs, with `job.view`) and **Run now**
  (platform admins).

## Shape

`api/` (client + wire types), `display.ts` (sizes, content-type and retention words, the refusal reasons in plain
words, the delete rules), `queries/` (QueryDefs, field options, columns, query functions for Files and Refused
uploads), `links.ts`, `nav.ts`.

The console's Volume & retention screen reads background-jobs' `GET /jobs` for the retention job's last run — an app
without `background-jobs.ui` drops that card.
