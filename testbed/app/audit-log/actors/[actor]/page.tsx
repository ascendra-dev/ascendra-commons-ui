"use client";

import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { AuditActorActivityScreen } from "@/ascendra-commons-ui/audit-logging.ui";
import { mockActorActivity } from "@/ascendra-commons-ui/audit-logging.ui/mocks";

export default function AuditActorActivityPage() {
  const { actor } = useParams<{ actor: string }>();
  return (
    <DashboardShell>
      <AuditActorActivityScreen actor={actor} fetchActivity={mockActorActivity} />
    </DashboardShell>
  );
}
