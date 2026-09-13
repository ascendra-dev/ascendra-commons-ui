'use client';

import Link from 'next/link';
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
} from '@/ascendra-ui';
import { auditApi } from '../api/audit-api.client';
import { auditLogLinks } from '../links';
import type { AuditEventDetail } from '../api/audit-api.types';

export interface AuditEventDetailScreenProps {
  eventId: string;
  fetchDetail?: (id: string) => Promise<AuditEventDetail>;
}

/** Reached only by clicking an event's id in AuditLogListScreen — a permalink, not nav. */
export function AuditEventDetailScreen({ eventId, fetchDetail = auditApi.getEvent }: AuditEventDetailScreenProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-event-detail', eventId],
    queryFn: () => fetchDetail(eventId),
  });

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <BackLink href="/audit-log">Back to Audit Log</BackLink>
          <PageTitle>Audit Record</PageTitle>
          <PageSubtitle>{eventId}</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <MainContent>
        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {isError && <SimpleAlert variant="destructive">Could not load this audit record.</SimpleAlert>}
        {data && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardHeaderTitle>Record</CardHeaderTitle>
              </CardHeader>
              <CardPanel>
                <dl className="grid grid-cols-2 gap-4 p-5 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">Entity</dt>
                    <dd>
                      <Link
                        href={auditLogLinks.entityHistory(data.entityType, data.entityId)}
                        className="text-primary hover:underline"
                      >
                        {data.entityType} / {data.entityId}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Actor</dt>
                    <dd>{data.actor}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Action</dt>
                    <dd>{data.action}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Occurred</dt>
                    <dd>{new Date(data.occurredAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Tenant</dt>
                    <dd>{data.tenantId ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">Correlation ID</dt>
                    <dd>
                      <Link href={auditLogLinks.trace(data.correlationId)} className="text-primary hover:underline">
                        {data.correlationId}
                      </Link>
                    </dd>
                  </div>
                  {data.reason && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground text-xs">Reason</dt>
                      <dd>{data.reason}</dd>
                    </div>
                  )}
                </dl>
              </CardPanel>
            </Card>
            <Card>
              <CardHeader>
                <CardHeaderTitle>Field Changes</CardHeaderTitle>
              </CardHeader>
              <CardPanel>
                {data.diff.length === 0 ? (
                  <p className="text-muted-foreground p-5 text-sm">No field-level changes recorded.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground text-left text-xs">
                        <th className="p-3">Field</th>
                        <th className="p-3">Before</th>
                        <th className="p-3">After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.diff.map((entry) => (
                        <tr key={entry.field} className="border-border border-t">
                          <td className="p-3 font-medium">{entry.field}</td>
                          <td className="p-3">
                            <code>{JSON.stringify(entry.before)}</code>
                          </td>
                          <td className="p-3">
                            <code>{JSON.stringify(entry.after)}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardPanel>
            </Card>
          </div>
        )}
      </MainContent>
    </>
  );
}
