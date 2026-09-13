import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PageHeaderGroup, PageMain, PageSubtitle, PageTitle } from "@/ascendra-ui";

export default function HomePage() {
  return (
    <DashboardShell>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Dashboard</PageTitle>
          <PageSubtitle>
            No modules vendored yet — each shipped ascendra-commons-ui module adds its own nav
            entry here.
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>{/* module content mounts here as packages/*.ui ship */}</PageMain>
    </DashboardShell>
  );
}
