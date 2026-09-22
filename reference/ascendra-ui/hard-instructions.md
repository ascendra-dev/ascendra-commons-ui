# Ascendra UI — Hard Instructions (ascendra-commons-ui)

## Purpose

A living list of corrections to how `ascendra-ui` is actually used when
building `ascendra-commons-ui` module packages — found by manual review of
implemented screens against a module's own design mock (`<module>.api/mocks.html`
in `ascendra-commons`) and direct investigation of `ascendra-ui`'s real
component source. Same convention and purpose as
`ascendra-pay-002/reference/ascendra-ui/hard-instructions.md` — this is this
repo's **own** such registry, for admin/observability/DataTable-heavy findings
specific to building module UIs here, not a fork of that file. Read both (the
other lives in the `ascendra-pay-002` project, not copied here).

This file supplements, never replaces, `ascendra-ui`'s own
`docs/ui-reference.md`/`docs/showcase-reference.md`. Where an entry here and
those docs disagree, this entry wins — that's the case it exists to record.

## How to add an entry

Append a new entry below with the next `AUI-NNN` id, today's date, and:
**Observed gap**, **Correct pattern** (name the real component(s)), **Rule**
(stated so it can be checked against a diff), **Reference** (a real file in
`ascendra-ui`, never `docs/*.md` alone). Never delete or renumber; mark a
superseded entry rather than removing it.

## Entries

### AUI-001 — Every top-level screen's `PageHeader` needs `variant="dashboard"`

**Date:** 2026-09-14

**Observed gap:** `audit-logging.ui`'s first pass used bare `<PageHeader>` on
every screen — no bottom border separating the title from the content below,
found by PO review against `audit-logging.api/mocks.html`'s own `.page-head`
treatment.

**Correct pattern:** `PageHeader` takes a `variant?: "dashboard"` prop —
`variant === "dashboard" && "border-b border-border mb-8"` in the component's
own source. Without it, `PageHeader` renders with no border at all by design
(it's meant for cases where a caller wants to compose its own separator).

**Rule:** Every module screen's top-level `PageHeader` passes
`variant="dashboard"` unless a screen has a specific, stated reason not to.

**Reference:** `ascendra-ui/components/layout/page-header.tsx`.

---

### AUI-002 — Table header labels are sentence case; `DataTableHead`/`TableHead` need `whitespace-nowrap` until it's the default

**Date:** 2026-09-14

**Observed gap:** Column labels were Title Case ("Entity Type", "Correlation
ID") instead of sentence case, and headers wrapped onto two lines at narrow
widths — neither matches `audit-logging.api/mocks.html`, whose own CSS sets
`white-space: nowrap` on every `<th>` as a base style.

**Correct pattern:** No wrap behavior exists on `DataTableHead`/`TableHead`
today — confirmed against `ascendra-ui/components/data-table/data-table-head.tsx`
and `ascendra-ui/components/ui/table.tsx`; neither sets `whitespace-nowrap`
by default. This is a genuine component gap, not a misuse — logged as a
`Component` suggestion in `ascendra-ui/BACKLOG.md` (never patched directly in
a vendored copy — see AUI-003 in `ascendra-pay-002`'s own file for the same
"suggest, don't fork" rule applied to a different finding).

**Rule (interim, until the suggestion lands):** Every `DataTableHead`/
`TableHead` usage passes `className="whitespace-nowrap"`. Column/field labels
are always sentence case ("Occurred at", not "Occurred At") — capitalize
only the first letter and proper nouns.

**Reference:** `ascendra-ui/components/data-table/data-table-head.tsx`;
`ascendra-ui/components/ui/table.tsx`; the suggestion itself in
`ascendra-ui/BACKLOG.md`.

---

### AUI-003 — A record reached by clicking a table row is a `Sheet`, not a plain page

**Date:** 2026-09-14

**Observed gap:** `AuditEventDetailScreen`'s first pass was a plain page
(`PageHeader` + `Card`/`CardPanel` + a hand-rolled `<dl>`), not a `Sheet` —
`audit-logging.api/mocks.html`'s own "Record detail" section is explicitly a
drawer (`data-label="Drawer — Audit record (Sheet, right)"`).

**Correct pattern:** `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`/
`SheetDescription`/`SheetBody`/`SheetProperties`/`SheetKey`/`SheetValue`/
`SheetSection`/`SheetSectionHeader` — the "Detail view" pattern
`create-sheet.md` itself documents (key-value rows via `SheetProperties`,
grouped with `SheetSection`). `create-sheet.md`'s own default assumes the
sheet's open/close state lives on the *same page* as the triggering table
(`useState`, no navigation) — a deep-linkable/permalink record (this one's
`AuditEventReader.findOne` doc comment calls it exactly that) is the one
case that stays its own route instead, still styled as a `Sheet` via a
`Sheet open onOpenChange={...}` wrapper that navigates back on close.

**Rule:** Any "click a row to see the record" screen uses the `Sheet`
system, never a full `PageHeader`/`Card` page. If the record needs a stable,
shareable URL, keep it a route but still render `Sheet`/`SheetContent`
inside it (open state controlled by the route itself, `onOpenChange`
navigating back) rather than a plain page layout.

**Reference:** `ascendra-ui/components/ui/sheet.tsx`;
`ascendra-ui/.claude/commands/create-sheet.md` ("Detail view" pattern).

---

### AUI-004 — `DataTableHighlight` is required on every searchable cell of a query-driven table

**Date:** 2026-09-14

**Observed gap:** `AuditLogListScreen`'s first pass rendered plain text in
every cell — `DataTableSearchInput` was present and functional, but no cell
used `DataTableHighlight`, so a search match was never visually marked in
the results, unlike every real reference (`data-table-lab/page.tsx`).

**Correct pattern:** `DataTableHighlight` (`text`, `item`, `itemKey` props) —
wraps a cell's text and marks the matched substring via `useDataTableSearch()`'s
`getRanges`. Used for every plain-text cell value in the one full reference
page (`invoiceNumber`, `clientName`, `amount`, `dueDate`, `issuedAt`).

**Rule:** Any cell showing a searchable text value in a
`DataTableWithQueryProvider`/`DataTableProvider` table wraps that text in
`DataTableHighlight`. A composed cell (badge + id, a link) still wraps its
plain-text portion.

**Reference:** `ascendra-ui/components/data-table/data-table-highlight.tsx`;
`ascendra-ui/app/showcase/data-table-lab/page.tsx` (original repo — not
vendored here since showcase pages aren't part of the copied library, but
the pattern is what this entry follows).

---

### AUI-005 — `CopyText` is required on any identifier a user would want to copy

**Date:** 2026-09-14

**Observed gap:** Actor ids, entity ids, correlation ids, and event/record
ids all rendered as plain text with no copy affordance — `CopyText` exists
in the library and was simply never used.

**Correct pattern:** `CopyText` (`value`, `showTooltip`, `className`,
`children`) — wraps an identifier, shows a copy icon, copies `value` to the
clipboard on click, optional tooltip confirmation.

**Rule:** Any cell/property value that is an id a person would plausibly
want to copy (event id, entity id, correlation id, actor id) uses `CopyText`.
When the same value is also a navigation link (e.g. a correlation id linking
to its trace), give the link and the copy affordance separate click targets
— `CopyText`'s own root element owns the click-to-copy handler, so nesting a
second `onClick` inside its children fires both at once; use a sibling
element (e.g. a small icon-button) for the navigation action instead.

**Reference:** `ascendra-ui/components/util/copy-text.tsx`.

---

### AUI-006 — Design a `data-table-lab` filter scenario as one combinable "Advanced Filter", not fragmented single-purpose presets, when the API ANDs arbitrary fields

**Date:** 2026-09-14

**Observed gap:** `AuditLogListScreen`'s first pass split `audit-logging.api`'s
one ANDed `AuditQuery` (every field optional, all combinable) into five
separate, mutually-exclusive named `QueryDef`s ("By Entity", "By Actor &
Action", …) — a user could never combine, say, an actor filter with a date
range, even though the underlying API supports exactly that.

**Correct pattern:** One `group: 'filter'` `QueryDef` carrying every
combinable field as its own `ParamItem`, laid out with `QueryDef.columns`
(`{ sm, md, lg }`, already supported by `data-table-query.types.ts`, easy to
forget to set) for a proper multi-column grid instead of one field per row.

**Rule:** Before splitting a filterable list screen into multiple named
`QueryDef`s, check whether the backing API's filter fields are independently
ANDable. If they are, model it as one "Advanced Filter" `QueryDef` with all
fields together (plus `columns` for layout) rather than one preset per field
— reserve separate named presets for scenarios that are genuinely different
requests (e.g. a dedicated endpoint), not different filters on the same one.

**Reference:** `ascendra-ui/providers/data-table-query/data-table-query.types.ts`
(`QueryDef.columns`); `ascendra-pay-002/reference/ascendra-ui/field-hint-guide.md`
for the mandatory/optional badge authoring guidance that applies to the same form.

---

### AUI-007 — A tiny mock batch size can make `usePagination`'s "Results per page" control look broken — it isn't

**Date:** 2026-09-14

**Observed gap:** PO review reported the "Results per page" selector "does
not reflect changes" on `AuditLogListScreen`.

**Correct pattern:** Confirmed against `ascendra-ui/providers/data-table/data-table.provider.tsx`
and `use-pagination.hook.ts`: when a table uses `DataTableWithQueryProvider`,
`DataTableProvider`'s `data` is the *current server batch* only (from the
query context), and `usePagination` re-slices client-side *within that one
batch*. The mock's `audit-events.mock.ts` batch size was 3 — smaller than
every "Results per page" option (5/10/15/20/100) — so changing it had
nothing to visibly change. The control itself is wired correctly
(`Select`'s `onValueChange` → `pagination.setPageSize`).

**Rule:** Before concluding a `DataTableWithQueryProvider` pagination control
is broken, check whether the mock/fixture batch size is at least as large as
the smallest "Results per page" option being tested — a batch smaller than
every page-size choice will always look inert, independent of whether the
control works.

**Reference:** `ascendra-ui/providers/data-table/data-table.provider.tsx`;
`ascendra-ui/providers/data-table/use-pagination.hook.ts`;
`ascendra-ui/components/ui/table.tsx` (`TableFoot`'s page-size `Select`).
