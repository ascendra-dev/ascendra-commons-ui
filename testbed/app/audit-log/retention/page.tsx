"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { AuditRetentionScreen, type RetentionStats } from "@/ascendra-commons-ui/audit-logging.ui";

const MOCK_RETENTION_STATS: RetentionStats = {
  oldestRecordAt: new Date(Date.now() - 309 * 86_400_000).toISOString(),
  rowCount: 1_204_881,
  approxBytes: 612 * 1024 * 1024,
  retentionJob: null,
  correlationIdCoveragePct: 99.8,
};

export default function AuditRetentionPage() {
  return (
    <DashboardShell>
      <AuditRetentionScreen stats={MOCK_RETENTION_STATS} />
    </DashboardShell>
  );
}
