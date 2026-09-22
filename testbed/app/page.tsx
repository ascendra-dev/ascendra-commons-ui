import { PageHeader, PageHeaderGroup, PageMain, PageSubtitle, PageTitle } from "@/ascendra-ui";

/**
 * The vertical's own home page. The one link into the observability shell
 * lives in the top bar (app/layout.tsx) — every vertical page, this one
 * included, keeps that same top bar; only /observability adds its own
 * sidebar on top of it (packages/observability/layout.tsx).
 */
export default function HomePage() {
  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Ascendra Commons UI — Testbed</PageTitle>
          <PageSubtitle>A stand-in vertical app, proving the copy-once observability shell.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain />
    </>
  );
}
