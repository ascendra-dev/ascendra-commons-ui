"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { AuditOverviewScreen } from "@/ascendra-commons-ui/audit-logging.ui";
import { mockStats } from "@/ascendra-commons-ui/audit-logging.ui/mocks";

export default function AuditOverviewPage() {
  return (
    <DashboardShell>
      <AuditOverviewScreen fetchStats={mockStats} />
    </DashboardShell>
  );
}
