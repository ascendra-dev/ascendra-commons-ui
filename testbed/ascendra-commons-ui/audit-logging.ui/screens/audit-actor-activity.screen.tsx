'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BackLink,
  Card,
  CardHeader,
  CardHeaderTitle,
  CardPanel,
  MainContent,
  PageHeader,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
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
import { auditApi } from '../api/audit-api.client';
import { auditLogLinks } from '../links';
import type { ActorActivitySummary } from '../api/audit-api.types';

export interface AuditActorActivityScreenProps {
  actor: string;
  fetchActivity?: (actor: string) => Promise<ActorActivitySummary>;
}

/** Reached only by clicking an actor cell elsewhere in audit-logging.ui — not nav. */
export function AuditActorActivityScreen({
  actor,
  fetchActivity = (a) => auditApi.actorActivity(a),
}: AuditActorActivityScreenProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-actor-activity', actor],
    queryFn: () => fetchActivity(actor),
  });

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <BackLink href={auditLogLinks.list()}>Back to Audit Log</BackLink>
          <PageTitle>Actor Activity</PageTitle>
          <PageSubtitle>{actor}</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <MainContent>
        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {isError && <SimpleAlert variant="destructive">Could not load this actor&apos;s activity.</SimpleAlert>}
        {data && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardPanel>
                <dl className="grid grid-cols-2 gap-4 p-5 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">First seen</dt>
                    <dd>{data.firstSeen ? new Date(data.firstSeen).toLocaleString() : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Last seen</dt>
                    <dd>{data.lastSeen ? new Date(data.lastSeen).toLocaleString() : '—'}</dd>
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
                        <TableHead className="whitespace-nowrap">Action</TableHead>
                        <TableHead className="whitespace-nowrap">Count</TableHead>
                        <TableHead className="whitespace-nowrap">Last</TableHead>
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
                            {new Date(row.lastOccurredAt).toLocaleString()}
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
    </>
  );
}
