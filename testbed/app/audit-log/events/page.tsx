"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { AuditLogListScreen } from "@/ascendra-commons-ui/audit-logging.ui";
import { mockAuditQueryFunctions, mockDownloadCsv } from "@/ascendra-commons-ui/audit-logging.ui/mocks";

export default function AuditLogListPage() {
  return (
    <DashboardShell>
      <AuditLogListScreen queryFunctions={mockAuditQueryFunctions} downloadCsv={mockDownloadCsv} />
    </DashboardShell>
  );
}
