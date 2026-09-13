"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AuditEntityHistoryScreen } from "@/ascendra-commons-ui/audit-logging.ui";
import { mockEntityHistory } from "@/ascendra-commons-ui/audit-logging.ui/mocks";

export default function AuditEntityHistoryPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  return (
    <DashboardShell>
      <AuditEntityHistoryScreen entityType={type} entityId={id} fetchHistory={mockEntityHistory} />
    </DashboardShell>
  );
}
