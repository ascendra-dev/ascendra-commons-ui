import {
  MainContent,
  PageContent,
  PageHeader,
  PageHeaderGroup,
  PageMain,
  PageSubtitle,
  PageTitle,
  PageWrapper,
} from '@/ascendra-ui';

/** The shell's own landing page — the mount root a vertical's one link points to. */
export default function ObservabilityHomePage() {
  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Observability</PageTitle>
          <PageSubtitle>
            Admin &amp; observability for every ascendra-commons module bundled here — Audit Log is the
            first.
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>{/* module overviews are reached via the sidebar as they ship */}</MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </>
  );
}
