"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AuditEventDetailScreen } from "@/ascendra-commons-ui/audit-logging.ui";
import { mockGetEvent } from "@/ascendra-commons-ui/audit-logging.ui/mocks";

export default function AuditEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <DashboardShell>
      <AuditEventDetailScreen eventId={id} fetchDetail={mockGetEvent} />
    </DashboardShell>
  );
}
