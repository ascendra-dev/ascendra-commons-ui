import { DashboardShell } from "@/components/dashboard-shell";
import { PageHeader, PageHeaderGroup, PageMain, PageSubtitle, PageTitle } from "@/ascendra-ui";

export default function HomePage() {
  return (
    <DashboardShell>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Dashboard</PageTitle>
          <PageSubtitle>
            One link per shipped module — audit-logging.ui is the first.
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>{/* module content mounts here as packages/*.ui ship */}</PageMain>
    </DashboardShell>
  );
}
