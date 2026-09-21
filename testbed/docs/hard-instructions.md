# Ascendra UI — Hard Instructions

## Purpose

A living list of corrections to how `ascendra-ui` is actually used in practice — found by
PO manual review of implemented screens, or by direct investigation against `../ascendra-ui`'s
real component source and real page implementations (not just its own prose docs).

**This file supplements, never replaces, `ascendra-ui`'s own documentation.** Any command
building UI against `ascendra-ui` (currently `/implement-story`; potentially `/gen-ui-mocks`
in future) reads `ascendra-ui/docs/ui-reference.md` and `ascendra-ui/docs/showcase-reference.md`
(or the project's own `standards/ui-reference.md` if it maintains one) exactly as it always
has. This file is read *in addition to* those, as the last thing checked before writing UI
code — because in practice those docs are sometimes incomplete, or (rarer, but confirmed —
see AUI-003, AUI-004) actually wrong about what the real component library does. The
underlying condition is unchanged: `ascendra-ui` is used because the project's confirmed
tech stack (`system-architecture.md` Section 2) selected Next.js + Ascendra UI — this file
does not change that decision or apply when a different frontend is confirmed.

**This file is not a UI style guide and does not replace exploring `../ascendra-ui` directly.**
When a pattern isn't covered below, the fallback is still: read the docs, then check
`../ascendra-ui/components/{forms,dialogs,sheets,drawers}/` and `../ascendra-ui/app/showcase/`
for the closest real page and copy its actual structure — never invent a structure freehand.

---

## How to add an entry

Append a new entry below with the next `AUI-NNN` ID, today's date, and:

- **Observed gap:** what was actually built (with a file:line or story reference if known)
- **Correct pattern:** what `ascendra-ui` actually provides — name the component(s)
- **Rule:** the instruction to follow going forward, stated so it can be checked against a diff
- **Reference:** the real file(s) in `../ascendra-ui` that prove the correct pattern (a
  showcase page, a real form/dialog implementation, or the component's own source) — never
  cite `docs/*.md` alone as the reference, since these entries exist precisely for cases where
  the docs and the real implementation disagree

Never delete or renumber an entry. If a later entry corrects or narrows an earlier one, mark
the earlier one `Superseded by AUI-NNN` rather than removing it.

---

## Entries

### AUI-001 — Section headers inside a form/dialog use `FieldLegend`, never a raw heading tag

**Date:** 2026-07-18

**Observed gap:** `app/signup/page.tsx` (US-02-001) uses raw `<h3 className="text-muted-foreground mb-3 text-[0.8125rem] font-medium tracking-wide uppercase">` for its two section headers ("Business details", "Your details (Owner)").

**Correct pattern:** `FieldLegend` (from `field.tsx`) — `<FieldLegend>Section Title</FieldLegend>` for a full section header, `<FieldLegend variant="label">Sub-label</FieldLegend>` for a smaller inline label. Confirmed: every real form page in `../ascendra-ui/components/forms/*.tsx` uses `FieldLegend` for this; none use a raw heading element.

**Rule:** Any section header inside a `Card`/`CardPanel`/dialog form body must use `FieldLegend`, styled via its own `variant` prop, never a hand-rolled heading element with manual Tailwind classes.

**Reference:** `../ascendra-ui/components/forms/contact-inquiry-form.tsx` (`<FieldLegend>Additional Information</FieldLegend>`); `../ascendra-ui/ascendra-ui/components/ui/field.tsx` (component definition).

---

### AUI-002 — Field error/hint display uses `FieldHint`, not `FieldError`

**Date:** 2026-07-18

**Observed gap:** `app/signup/page.tsx` and `components/staff/add-staff-dialog.tsx` (US-01-003) both use `<FieldError errors={errors.x ? [errors.x] : []} />` under each input.

**Correct pattern:** `FieldHint` — `<FieldHint error={errors.x as {message?: string}} mandatory />` (or `optional`, or with no props at all for a field with neither state). `FieldError` is exported from `field.tsx` and is a valid component, but it is not the convention actually followed anywhere: `grep -rl FieldError ../ascendra-ui/components/forms/` returns zero files; `grep -rl FieldHint` returns all ten.

**Rule:** Every `Field`'s error/hint row must use `FieldHint`, passing its `error` prop (a single `{message?}` object, not an array) and `mandatory`/`optional`/`help` as applicable — never `FieldError`.

**Reference:** `../ascendra-ui/components/forms/contact-inquiry-form.tsx` lines ~150–153. **See `reference/ascendra-ui/field-hint-guide.md` for the component's full prop reference, its space-reservation behavior, and the `mandatory`/`optional` badge-density authoring guidance** — `FieldHint` has more surface area than this entry alone covers.

---

### AUI-003 — `Field` does not need a `FieldContent` wrapper

**Date:** 2026-07-18

**Observed gap:** `app/signup/page.tsx` and both staff dialogs wrap every field's control and error as `<Field><FieldLabel/><FieldContent><Input/><FieldError/></FieldContent></Field>`.

**Correct pattern:** `Field > FieldLabel + Control + FieldHint`, as direct siblings — no `FieldContent` wrapper. Confirmed: `grep -rl FieldContent ../ascendra-ui/components/` returns exactly one file, `previews/field-preview.tsx` (the isolated component-preview page used only to document the `Field` primitive itself) — it is not used in any real form, dialog, sheet, or drawer page.

**Note — the docs disagree with the real pages here:** `ascendra-ui/docs/showcase-reference.md`'s own "Template 2 — Settings/Form Page" and "Template 5 — Dialog Patterns" code samples both show `FieldContent` wrapping the control. When a docs template and the real page implementations under `../ascendra-ui/components/` disagree, follow the real pages — the docs prose can drift from the library; the component source and real usage cannot.

**Rule:** Never wrap a `Field`'s control in `FieldContent`. Put the control and `FieldHint` directly inside `Field`.

**Reference:** `../ascendra-ui/components/forms/contact-inquiry-form.tsx`; `../ascendra-ui/components/dialogs/invite-member-dialog.tsx`.

---

### AUI-004 — `DialogContent` has no `showCloseButton` prop

**Date:** 2026-07-18

**Observed gap:** `components/staff/add-staff-dialog.tsx` (US-01-003) passed `<DialogContent showCloseButton>` — this is a real TypeScript build error (`Property 'showCloseButton' does not exist`), caught only because `next build` was run before committing.

**Correct pattern:** `DialogContent` takes no such prop — confirmed against `../ascendra-ui/ascendra-ui/components/ui/dialog.tsx`'s actual source. `docs/ui-reference.md`'s own Dialog prop table lists `showCloseButton` — that documented prop does not exist on the real component.

**Rule:** Never pass `showCloseButton` (or any prop not visible in the component's actual source at `../ascendra-ui/ascendra-ui/components/`) — when a docs prop table is the only source for an unfamiliar prop, verify it against the real component source before using it, since this specific prop was already found to be fictional.

**Reference:** `../ascendra-ui/ascendra-ui/components/ui/dialog.tsx`.

---

### AUI-005 — A Data Table page's primary action button goes in `DataTableBarAction`, not `PageHeaderAction`

**Date:** 2026-07-18

**Observed gap:** `app/(issuer-app)/staff/page.tsx` (US-01-003) places the "Add Staff" dialog trigger inside `<PageHeader><PageHeaderAction>`.

**Correct pattern:** `<DataTableBar><DataTableBarContent>...(search/filters)...</DataTableBarContent><DataTableBarAction><Button>+ Add X</Button></DataTableBarAction></DataTableBar>`, placed above the table itself. Confirmed by grepping every real usage of `PageHeaderAction` across the whole showcase (`components/` + `app/showcase/`): it appears only in dashboard pages (date-range pickers, export actions) — never on a page whose main content is a table/list.

**Rule:** On any screen whose primary content is a `DataTable`/`DataTableWithQueryProvider`, the "Add/Create" action lives in that table's own `DataTableBarAction`, not the page header.

**Reference:** `../ascendra-ui/app/showcase/data-table-lab/page.tsx` (`<DataTableBarAction><Button>+ Add Invoice</Button></DataTableBarAction>`).

---

### AUI-006 — Explore the full Data Table feature surface before building a listing screen; use only what the requirements need

**Date:** 2026-07-18

**Observed gap:** N/A — not yet a defect, but a process gap worth stating before it becomes one: `/implement-story` has so far only ever built the plain `DataTableProvider` + search-input shape (the "Static Data Table" template), without checking whether a story's actual requirements call for more of what `ascendra-ui`'s Data Table system offers.

**Correct pattern:** The Data Table system supports — among other things — sorting, select-all/bulk row actions, per-row action menus, search (including fuzzy search via `DataTableHighlight`), column filtering, column reordering and visibility, saved column preferences, a query provider supporting multiple named/preset queries with their own param forms ("My Queries", saved/runnable filters), and server-driven pagination across batches. `../ascendra-ui/app/showcase/data-table-lab/page.tsx` is the single fullest real reference exercising most of this at once; `docs/showcase-reference.md`'s "DataTable System" section documents the underlying API (`ColumnDef`, `QueryFn`, `QueryDef`, `FieldOptionsMap`).

**Rule:** Before building any Table-List screen, read the "DataTable System" section of `docs/showcase-reference.md` and open `data-table-lab/page.tsx` — not to copy every feature, but to make a deliberate choice of which features the story's ACs actually call for. A compact, search-only table is a legitimate choice when that's genuinely all a screen needs (e.g. a short staff roster) — it should never be the *default* arrived at without having checked what else was available.

**Reference:** `../ascendra-ui/app/showcase/data-table-lab/page.tsx`; `ascendra-ui/docs/showcase-reference.md` "DataTable System" section.

---

### AUI-007 — Copy the structural shape of the closest real reference page; don't hand-tune spacing

**Date:** 2026-07-18

**Observed gap:** PO review of the signup page and both staff dialogs described them as visually "rough — no proper spacing" compared to real `ascendra-ui` pages, despite using the right primitive components.

**Correct pattern:** Every real form/dialog/sheet/drawer page's spacing (gaps in `FieldGrid`/`FieldSet`/`FieldGroup`, `CardPanelItem` grouping, dialog `DialogBody`/`DialogFooter` padding) comes from the primitives' own built-in class names, not page-level utility classes layered on top. When a page looks "off," the usual cause is a hand-added spacing class fighting the primitive's own default, or a structural piece (e.g. `FieldSet`/`FieldGrid` around a set of related fields) being skipped rather than nested correctly.

**Rule:** For any new form or dialog, find the closest matching real page under `../ascendra-ui/components/{forms,dialogs,sheets,drawers}/` and copy its structural nesting exactly (which wrapper contains which, in what order) — change only the field content, labels, and validation. Do not add spacing/layout utility classes not already present in the reference page's own JSX.

**Reference:** `../ascendra-ui/components/forms/` and `../ascendra-ui/components/dialogs/` (pick the closest match by field count/complexity, same method `screen-design.md`'s "Matched Reference" column already uses at the design stage).

---

### AUI-008 — The real application shell has two top bars (`Header`, `Nav`) in addition to the sidebar; `Header` is never optional, `Nav` is situational

**Date:** 2026-07-18

**Observed gap:** `app/(issuer-app)/layout.tsx` (US-01-003 — the first story to reach this portal) has no `Header` and no `Nav` at all — just `SideBarOverlay > MainContainer(SideBarToggle + SideBar + ContentArea)`.

**Correct pattern:** The real full shell (`../ascendra-ui/app/showcase/layout.tsx`, the library's own dogfooded layout) is:
```
PageLayout
├── SideBarOverlay
├── Header            ← HeaderLinks (brand/breadcrumb) + HeaderActions (ThemeToggle, NameAvatar, sign-out, etc.)
├── Nav               ← optional: NavLink[] secondary sticky tab-strip, top-level section switcher
└── MainContainer
    ├── SideBarToggle
    ├── SideBar > SideBarMain > SideBarMenuSet[...]
    └── ContentArea
```

**Rule:**
- **`Header` is required on every real app shell, never treated as optional scaffolding** — even a "first screen in this portal" story must include at least a minimal `Header` (brand name via `HeaderLinks`/`HeaderLink`, a `HeaderActions` slot for at least a sign-out affordance). It is not blocked by an unbuilt login screen — a sign-out button can call the auth client's `signOut()` directly regardless of whether a dedicated login page exists yet.
- **`Nav` is situational, not a peer requirement to `Header`.** Only add it when the architecture's Navigation Map or a screen's own design actually calls for top-level section-switching or page-level tabs (see `docs/showcase-reference.md` Template 1's "with secondary nav tabs" variant, itself a different, page-level use of the same `Nav` component). Its absence is a legitimate scope decision, not a gap, when nothing in the architecture calls for it — check the Navigation Map (`arch-v1.md` Section 3.1.3.2) before adding one speculatively.

**Reference:** `../ascendra-ui/app/showcase/layout.tsx`.

---

### AUI-009 — A flat, non-collapsible sidebar group uses `SideBarMenuItemGroup` directly; only a real collapsible group uses `SideBarMenu` + `SideBarMenuHeader` + `SideBarMenuContent`

**Date:** 2026-07-18

**Observed gap:** `app/(issuer-app)/layout.tsx` built the Staff nav group as `SideBarMenu basePath="/app" > SideBarMenuSet > SideBarMenuContent > SideBarMenuItem` — a collapsible-accordion composition — for a group that is a single flat item with no sub-items and no need to collapse.

**Correct pattern:** Two distinct, real compositions exist and are not interchangeable:
- **Collapsible group** (has its own expand/collapse state, toggled by a clickable header): `SideBarMenuSet > SideBarMenu(basePath) > SideBarMenuHeader(icon) + SideBarMenuContent > SideBarMenuItem[]`. `SideBarMenuHeader` is the required clickable toggle (chevron icon, click handler) — `SideBarMenuContent`'s visibility CSS (`group-data-[open=true]`) depends on `SideBarMenu`'s own `data-open` state, which `SideBarMenuHeader`'s click handler (or an active-route match) sets.
- **Flat, always-visible group** (no collapse behavior at all): `SideBarMenuSet > SideBarMenuSetTitle + SideBarMenuItemGroup > SideBarMenuItem[]` — no `SideBarMenu`, no `basePath`, no `SideBarMenuHeader`, no `SideBarMenuContent`. Confirmed real usage: the "Samples" section's Dialog/Sheet/Drawer Gallery group, and the ungrouped Tabs/Sidebar Menu pair, in `../ascendra-ui/app/showcase/layout.tsx`.

Using the collapsible composition without its required `SideBarMenuHeader` (as built here) happens to still render — because a `basePath` matching every route in the portal forces it permanently "open" — but it's the wrong component pair for what's actually displayed, not a cosmetic variant of the right one.

**Rule:** Before adding a sidebar group, check whether it needs real expand/collapse behavior (multiple items under a toggleable header). If it's a single item or a short always-visible list — matching a group in the approved mock/Navigation Map that shows no collapse affordance — use `SideBarMenuItemGroup` directly, never `SideBarMenu`/`SideBarMenuContent` without its required `SideBarMenuHeader`.

**Reference:** `../ascendra-ui/app/showcase/layout.tsx`; `../ascendra-ui/ascendra-ui/components/side-bar/side-bar-menu-header.tsx`, `side-bar-menu-item-group.tsx`.

---

### AUI-010 — `FieldHint` ignores `children`; pass hint text via the `description` prop

**Date:** 2026-07-18

**Observed gap:** `app/signup/page.tsx` used `<FieldHint>Only Pakistan is supported in v1 — any other selection is rejected.</FieldHint>` and `<FieldHint>You'll be seeded with all four capabilities...</FieldHint>` — passing the hint text as JSX children. Reading `field.tsx`'s actual implementation: `FieldHint`'s parameters are `{ error, description, mandatory, optional, help, className, ...props }`, and its body never reads `children` — the component always renders its own fixed internal JSX (an error-or-description row, plus optional mandatory/optional/help badges) and guards with `if (!error && !description && !mandatory && !optional && !help) return null;`. Passing only children (no `description`) means every one of those checks is falsy — **the component returns `null` and the hint text does not render at all.** This was a real, silent rendering bug, not just a convention mismatch — found only by reading the component's source, not by looking at the page.

**Correct pattern:** `<FieldHint description="Only Pakistan is supported in v1 — any other selection is rejected." />`. Confirmed real usage: `../ascendra-ui/components/forms/create-product-form.tsx`, `user-profile-form.tsx` — every non-error hint uses `description=`, never children.

**Rule:** `FieldHint` never takes children. Pure informational hint text uses `description="..."`; a validation error uses `error={fieldState.error}`; `mandatory`/`optional`/`help` are separate boolean/string props layered on top of either. Never pass hint text as JSX children — it will silently not render.

**Reference:** `../ascendra-ui/ascendra-ui/components/ui/field.tsx` (`FieldHint`'s actual body); `../ascendra-ui/components/forms/create-product-form.tsx`. **Full component reference:** `reference/ascendra-ui/field-hint-guide.md`.

---

### AUI-011 — `FieldLegend` is followed immediately by a `FieldDescription` explaining the section

**Date:** 2026-07-18

**Observed gap:** `app/signup/page.tsx` (US-02-001) used `FieldLegend` alone for "Business details" and "Your details (Owner)" — no description sentence explaining what each section is for or why it matters.

**Correct pattern:** A section header is `FieldLegend` immediately followed by a `FieldDescription` — one to two sentences giving the section context, before the fields themselves. Confirmed real usage: `../ascendra-ui/components/forms/contact-inquiry-form.tsx` line ~366 (`<FieldLegend>Additional Information</FieldLegend>` directly followed by `<FieldDescription>Please provide any additional information that may help us better assist you.</FieldDescription>`). `FieldDescription`'s own CSS even has a rule specifically for this adjacency (`[[data-variant=legend]+&]:-mt-1.5` — a tighter top margin when it directly follows a legend).

**Rule:** Every `FieldLegend` used as a section header should be immediately followed by a `FieldDescription` stating what the section covers or why it matters — not left to stand alone. Compose the sentence from the story/BRD's own domain language for that section (what the fields are used for, what happens as a result of filling them in) rather than generic filler text.

**Reference:** `../ascendra-ui/components/forms/contact-inquiry-form.tsx`; `../ascendra-ui/ascendra-ui/components/ui/field.tsx` (`FieldDescription`'s adjacency CSS rule).

---

### AUI-012 — A form's success/error banner uses `SimpleAlert`, not a hand-rolled `<p>`

**Date:** 2026-07-22

**Observed gap:** `app/signup/page.tsx` (US-02-001) renders its mutation-error state as
`<p className="text-destructive text-sm" role="alert">{...}</p>` — a hand-rolled element, not a
real component.

**Correct pattern:** `SimpleAlert` (`common-ui/simple-alert.tsx`) — `variant="destructive"` for an
error, `variant="success"` for a success confirmation. Confirmed real usage:
`components/verification/document-upload-form.tsx` (`<SimpleAlert variant={...}>...</SimpleAlert>`
for a status banner above a form).

**Rule:** Any form-level success or error banner (not a per-field `FieldHint`) uses `SimpleAlert`
with the matching `variant`, never a hand-styled `<p>`/`<div>` with ad hoc Tailwind classes.

**Reference:** `components/verification/document-upload-form.tsx`; `ascendra-ui/components/common-ui/simple-alert.tsx` (component definition).
