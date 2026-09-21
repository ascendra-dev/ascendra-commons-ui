'use client';

import { BackLink, Card, CardPanel, MainContent, PageHeader, PageHeaderGroup, PageSubtitle, PageTitle, SimpleAlert, SimpleBadge } from '@/ascendra-ui';
import { auditLogLinks } from '../links';

export interface RetentionStats {
  oldestRecordAt: string;
  rowCount: number;
  approxBytes: number;
  retentionJob: { keepForDays: number; lastRunAt: string } | null;
  correlationIdCoveragePct: number;
}

export interface AuditRetentionScreenProps {
  /**
   * No default here on purpose — GET /audit/retention doesn't exist yet
   * (audit-logging.api/mocks.html itself marks this "Proposed", not "Live").
   * There is no real fetcher to fall back to; a consumer always supplies
   * mock/placeholder data explicitly. See the module README.
   */
  stats: RetentionStats;
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

/** Reached via the "Retention & Volume" button on AuditOverviewScreen — not nav.ts. */
export function AuditRetentionScreen({ stats }: AuditRetentionScreenProps) {
  const oldestDays = Math.round((Date.now() - new Date(stats.oldestRecordAt).getTime()) / 86_400_000);

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <BackLink href={auditLogLinks.list()}>Back to Audit Log</BackLink>
          <PageTitle>Retention &amp; Volume</PageTitle>
          <PageSubtitle>Read-only health of the audit store itself — how far back it goes, how big it is.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <MainContent>
        <SimpleAlert variant="warning">
          <b>Proposed, not live.</b> <code>GET /audit/retention</code> doesn&apos;t exist in
          audit-logging.api yet — everything below is fixed placeholder data, never a real fetch.
        </SimpleAlert>
        <Card>
          <CardPanel>
            <dl className="grid grid-cols-2 gap-4 p-5 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Oldest record</dt>
                <dd>
                  {new Date(stats.oldestRecordAt).toLocaleDateString()} ({oldestDays} days)
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Row count</dt>
                <dd>{stats.rowCount.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Approx. size</dt>
                <dd>{formatBytes(stats.approxBytes)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Retention job</dt>
                <dd>
                  {stats.retentionJob ? (
                    `keeps ${stats.retentionJob.keepForDays}d, last ran ${new Date(stats.retentionJob.lastRunAt).toLocaleString()}`
                  ) : (
                    <SimpleBadge variant="warning">none configured — table grows unbounded</SimpleBadge>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Correlation-id coverage</dt>
                <dd>{stats.correlationIdCoveragePct}% of rows</dd>
              </div>
            </dl>
          </CardPanel>
        </Card>
      </MainContent>
    </>
  );
}
