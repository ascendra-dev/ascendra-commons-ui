import {
  BackLink,
  Card,
  CardPanel,
  MainContent,
  PageContent,
  PageHeader,
  PageHeaderGroup,
  PageMain,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  SimpleAlert,
  SimpleBadge,
} from '@/ascendra-ui';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';

interface RetentionStats {
  oldestRecordAt: string;
  rowCount: number;
  approxBytes: number;
  retentionJob: { keepForDays: number; lastRunAt: string } | null;
  correlationIdCoveragePct: number;
}

/**
 * Mock data only, always — `GET /audit/retention` doesn't exist in
 * audit-logging.api yet (marked "Proposed" in its own mocks.html). There is
 * no real endpoint to call, so unlike every other page here this one has no
 * fetcher to swap — the placeholder below IS the implementation until a real
 * endpoint ships.
 */
const MOCK_RETENTION_STATS: RetentionStats = {
  oldestRecordAt: new Date(Date.now() - 309 * 86_400_000).toISOString(),
  rowCount: 1_204_881,
  approxBytes: 612 * 1024 * 1024,
  retentionJob: null,
  correlationIdCoveragePct: 99.8,
};

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

/** Reached via the "Retention & Volume" button on the Audit Log overview — not nav. */
export default function AuditRetentionPage() {
  const stats = MOCK_RETENTION_STATS;
  const oldestDays = Math.round((Date.now() - new Date(stats.oldestRecordAt).getTime()) / 86_400_000);

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <BackLink href={auditLogLinks.list()}>Back to Audit Log</BackLink>
          <PageTitle>Retention &amp; Volume</PageTitle>
          <PageSubtitle>Read-only health of the audit store itself — how far back it goes, how big it is.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>
        <PageWrapper>
          <PageContent>
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
          </PageContent>
        </PageWrapper>
      </PageMain>
    </>
  );
}
