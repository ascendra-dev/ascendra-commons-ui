"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { AuditLogListScreen } from "@/ascendra-commons-ui/audit-logging.ui";
import { mockAuditQueryFunctions } from "@/ascendra-commons-ui/audit-logging.ui/mocks";

export default function AuditLogPage() {
  return (
    <DashboardShell>
      <AuditLogListScreen queryFunctions={mockAuditQueryFunctions} />
    </DashboardShell>
  );
}
