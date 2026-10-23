# authorization.ui

The access console for `ascendra-commons`' `authorization.api` (Model 2 — the permission table): who can do what, and
changing it. One console for two audiences — a **platform admin** (`authz.platform`) sees every tenant and picks one; a
**tenant admin** sees its own tenant only (the API forces it; the screens just don't offer the rest) — plus **My access**
for anyone signed in. Built against `authorization.api/mocks.html`.

Unlike the observability modules it has its own shell — the app links to `/access` (`packages/access` in distribution,
`testbed/app/access` here) with its own sidebar (`authorizationNav`, `authorizationSelfNav`).

## The model, as the screens show it

A **role** grants **actions**; a person holds roles **in a tenant** (or **all tenants** — platform staff), optionally until
an end date. A person can **lend** some of their own actions to a colleague until a date (a **delegation**) — it grants
only while the lender still holds them; one that lends something the lender lost is **lapsed**. Each action is
**tenant**- or **platform**-scope; a role with a platform action is given to all tenants only, by a platform admin. Roles
ship with the app — the console gives them out and takes them back, never edits them.

## Shipped

- **Overview** — tiles: People (with a role), Without a role (→ People, no role), Active delegations, Lapsed
  delegations (→ Delegations, lapsed), Roles ending (assignments within 7 days — a count of assignments, no list, so no
  link), Denied requests (the period → Denied requests); a platform admin adds Platform access. **Who holds what**
  (holders per role → the Role) and **Needs a look** (lapsed delegations, roles and delegations ending, the most refused
  people).
- **People** — the app's users (its `AuthzUserDirectory`) by name with their active roles; Find people (name or email,
  holds role, no role, a platform admin's tenant). Pick people from one tenant → **Give a role** to all of them.
- **Person** — roles (given by, until, Take away — 409 for the last admin or yourself, shown as the API's message), what
  they can do by module with where each action comes from, delegations lent and received, what they were refused.
- **Roles · Role** — each role's scope, actions and holders here; the Role page groups its actions by module with their
  meanings and lists its holders; **Give this role** picks people, then the end date.
- **Delegations** — the ledger (Active; Filter delegations by state — active, expiring, lapsed, expired, revoked — and
  person); a row opens the delegation sheet (Revoke).
- **Access checker** — "Can this person…" (allowed / denied with the reason: a role, a delegation, a lapsed one) and
  "Who can…" (holders and live delegations). The URL carries the question (`authorizationLinks.checker`).
- **Denied requests** — most refused actions and people over a period, and the list (Recent; Filter by person, action
  and a required range up to 90 days).
- **Action catalog** — drift and description tiles; every action by module with its scope and roles; a platform admin
  describes them.
- **My access** — anyone's: what I can do and why, what I lent and was lent (take back / give back), and lending some of
  mine (only what my roles give me, tenant-scope, at most 90 days).

**The give-a-role dialog** reads `GET /authz/roles/assignable`: roles the viewer can't give stay listed, disabled, with
the API's reason (a platform-wide role, an action you don't hold).

## Notes

**Names come from the directory.** Lists of delegations and denials look names up once per page
(`authorizationApi.lookup`); someone the directory doesn't know (or out of the viewer's reach) shows as their id. My
access shows ids — a member can't read the directory.

**The tenant list is the app's.** A platform admin's picker reads `app/access/tenants.ts` — authorization only knows
tenant ids.

**A viewer without `authz.view`** who opens an admin screen by URL sees one note pointing to My access — the layout
waits for the session, so no read goes out to answer 403.

**No mock layer.** Every screen calls the real API (`ascendra-commons-sandbox` — 48 people, product roles, delegations
in every state and 30 days of denied requests, `src/cli/access-history.ts`).

**Built by hand, not on a shared factory** — the observability screens were the starting points (tiles, ranked lists,
the query-driven lists, sheets); shared pieces get extracted later (rollout plan).
