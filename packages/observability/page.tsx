import { PageHeader, PageHeaderGroup, PageMain, PageSubtitle, PageTitle } from '@/ascendra-ui';

/** The shell's own landing page — the mount root a vertical's one link points to. */
export default function ObservabilityHomePage() {
  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Observability</PageTitle>
          <PageSubtitle>
            Admin &amp; observability for every ascendra-commons module bundled here — Audit Log is the
            first.
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>{/* module overviews are reached via the sidebar as they ship */}</PageMain>
    </>
  );
}
