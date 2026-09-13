"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AuditTraceScreen } from "@/ascendra-commons-ui/audit-logging.ui";
import { mockTrace } from "@/ascendra-commons-ui/audit-logging.ui/mocks";

export default function AuditTracePage() {
  const { correlationId } = useParams<{ correlationId: string }>();
  return (
    <DashboardShell>
      <AuditTraceScreen correlationId={correlationId} fetchTrace={mockTrace} />
    </DashboardShell>
  );
}
