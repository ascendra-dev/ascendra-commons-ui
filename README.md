# Ascendra Commons UI

Admin / observability UI for [`ascendra-commons`](https://github.com/ascendra-dev/ascendra-commons)
modules, built on [`ascendra-ui`](https://github.com/ascendra-dev/ascendra-ui).
Distributed the same way both of those are — **copy-to-project**, not an npm
package, and **copied by hand**, not by a sync script — but as a second,
independent layer: a project vendors `ascendra-ui/` first, then copies in
whichever `ascendra-commons-ui` module packages it needs on top.

## Repository structure

```
ascendra-commons-ui/
  ascendra-ui/     # vendored copy of the component library — authoring/typecheck surface only
  packages/         # source of truth — one <module>.ui package per ascendra-commons module
    shared/          # cross-module infrastructure (link registry, the shared observability-log pattern)
  testbed/           # a real consumer Next.js app — every module.ui copied in exactly like a vertical would
```

See `packages/README.md` for the shape of a module package (`nav.ts`,
`links.ts`, `api/`, `queries/`, `screens/`, `mocks/`) and the two conventions
that keep "one dashboard link per module" real without becoming a hard rule.

**`packages/observability/` is a distribution mirror, not a second edit location.**
Unlike `packages/<module>.ui/` (genuinely the source of truth, copied by hand into
`testbed/ascendra-commons-ui/<module>.ui/`), `packages/observability/` — the shell
(`layout.tsx`) and route-level screens (`page.tsx` for the dashboard, list, detail,
trace, entity-history, actor-activity, retention screens) — exists only so a real
vertical has something to copy out as its own `observability/` (or `app/observability/`)
folder at distribution time. Day-to-day development edits `testbed/app/observability/`
only — it's the one that's live on the dev server and actually testable. Hand-editing
`packages/observability/` in lockstep on every change is unnecessary work and a real drift
risk (it already happened once — a retrofit landed in `testbed/` and silently never made
it into `packages/`, caught only by chance days later). Re-derive `packages/observability/`
from `testbed/app/observability/` as a distribution step instead, not as part of normal
development.

Currently vendored `ascendra-ui`: v1.4.0, commit `11b8d802d39ba70751514faa53371aa1971b5306`.
Update this line by hand whenever `ascendra-ui/` (here and in `testbed/`) is
manually re-synced.

## Local development

```bash
npm install               # repo root — lets you author/typecheck packages/ against ascendra-ui/
cd testbed && npm install # the actual consumer app
npm run dev                # testbed/ — http://localhost:3000
```

After adding or changing a module package under `packages/`, copy it into
`testbed/ascendra-commons-ui/<module>.ui/` by hand — the same copy a real
vertical would do — and mount its `nav.ts` into `testbed`'s dashboard shell.

## Status

Foundation only — no module packages ship yet. See the rollout plan for the
phase order (`audit-logging` first, then `background-jobs`, then the shared
observability-log pattern's other consumers, `notification`, `file-storage`,
`authorization` last).
