'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BackLink,
  Card,
  CardHeader,
  CardHeaderTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableWrapper,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { auditApi } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';

/**
 * The one fetcher this page calls — real API by default. A consumer without
 * a live backend (e.g. testbed) swaps this for a mock from
 * `audit-logging.ui/mocks` instead of editing the page body.
 */
const fetchActivity = (actor: string) => auditApi.actorActivity(actor);

/** Reached only by clicking an actor cell elsewhere in the Audit Log — not nav. */
export default function AuditActorActivityPage() {
  const { actor } = useParams<{ actor: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-actor-activity', actor],
    queryFn: () => fetchActivity(actor),
  });

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <BackLink href={auditLogLinks.list()}>Back to Audit Log</BackLink>
          <PageTitle>Actor Activity</PageTitle>
          <PageSubtitle>{actor}</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>
              {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
              {isError && (
                <SimpleAlert variant="destructive">Could not load this actor&apos;s activity.</SimpleAlert>
              )}
              {data && (
                <div className="flex flex-col gap-4">
                  <Card>
                    <CardPanel>
                      <dl className="grid grid-cols-2 gap-4 p-5 text-sm">
                        <div>
                          <dt className="text-muted-foreground text-xs">First seen</dt>
                          <dd>
                            {data.firstSeen ? formatDateTime(data.firstSeen, { style: 'relative' }) : '—'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground text-xs">Last seen</dt>
                          <dd>{data.lastSeen ? formatDateTime(data.lastSeen, { style: 'relative' }) : '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground text-xs">Total records</dt>
                          <dd>{data.totalRecords}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground text-xs">Tenants touched</dt>
                          <dd className="flex flex-wrap items-center gap-1.5">
                            {data.tenantsTouched.map((tenantId) =>
                              tenantId === null ? (
                                <SimpleBadge key="platform" variant="info">
                                  platform
                                </SimpleBadge>
                              ) : (
                                <span key={tenantId}>{tenantId}</span>
                              ),
                            )}
                          </dd>
                        </div>
                      </dl>
                    </CardPanel>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardHeaderTitle>By action</CardHeaderTitle>
                    </CardHeader>
                    <CardPanel>
                      <TableWrapper>
                        <Table>
                          <TableHeader>
                            <TableHeaderRow>
                              <TableHead>Action</TableHead>
                              <TableHead>Count</TableHead>
                              <TableHead>Last</TableHead>
                            </TableHeaderRow>
                          </TableHeader>
                          <TableBody>
                            {data.byAction.map((row) => (
                              <TableRow key={row.action}>
                                <TableCell>
                                  <SimpleBadge>{row.action}</SimpleBadge>
                                </TableCell>
                                <TableCell>{row.count}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {formatDateTime(row.lastOccurredAt, { style: 'relative' })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableWrapper>
                    </CardPanel>
                  </Card>
                </div>
              )}
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </>
  );
}
