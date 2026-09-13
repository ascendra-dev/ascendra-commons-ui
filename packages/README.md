# `packages/` — module UI packages

Source of truth for `ascendra-commons-ui`. Naming mirrors `ascendra-commons`
module names exactly — `audit-logging.ui`, not `audit-log-ui` — so the two
repos stay trivially cross-referenceable. See that repo's
`MODULE-STANDARD.md` §1b, which reserves this layer: `<module>.ui` — "React,
ships from `ascendra-commons-ui`, not here."

## Shape of a module package

```
<module>.ui/
  index.ts       # single public export surface — everything else is a private detail
  nav.ts         # this module's dashboard entry point(s). The ONLY thing a
                 # vertical's own dashboard is allowed to import to build nav.
  links.ts       # typed link-builders for every screen reached by click-through
                 # (detail, history, trace, …) — never a hardcoded path, so a
                 # vertical can remount the module at a different base route
                 # without breaking internal links.
  api/           # thin typed client over the matching <module>.api DTOs
  queries/       # QueryDef[] + QueryFunctionMap adapter for data-table-lab —
                 # only present when a screen actually uses the full query
                 # system. Screens that fit a Simple Table or a static/simple
                 # DataTable (see ascendra-ui's create-table.md) skip this.
  screens/       # list, detail, history, trace, admin forms — whichever this
                 # module needs; only the ones nav.ts points to are reachable
                 # from outside, the rest only via links.ts
  mocks/         # fixtures + mock QueryFunctionMap, used by testbed/ and by
                 # any consumer developing against this module before its
                 # real API is wired up
```

Not every module needs every folder — a module with no admin mutations has
no `admin` screens, a module whose one list fits a Simple Table has no
`queries/`. Absence is a pass, not an omission, the same way
`MODULE-STANDARD.md` treats an explicitly-reasoned N/A as a pass.

## `packages/shared/`

Cross-module infrastructure used by more than one package:

- `shared/links/` — the cross-module / cross-vertical link-resolution
  registry (a module can't know a vertical-owned route, e.g. an audit
  `entityType` of `invoice`; the vertical registers a resolver for it at
  boot instead of the module guessing a path shape).
- `shared/observability/` — the reusable "list + trace + catalog/health"
  screen factory, extracted once its shape is validated against
  `audit-logging.ui` and `background-jobs.ui` (see the repo's rollout plan).
  Not built until then — several modules (`rate-limiting`,
  `payment-link-security`, `payment-gateway-adapter`, `domain-events`,
  `idempotency-key`) will configure it rather than ship a bespoke screen.

## What a consumer receives

Copied by hand, into a project that already vendored `ascendra-ui/`: the
selected `<module>.ui` folders plus `shared/`, pasted into the consumer's own
`ascendra-commons-ui/` folder (see `testbed/ascendra-commons-ui/` for what
that looks like in practice). There is no sync script — versioning and
updates are tracked and applied manually until that tooling is revisited.
