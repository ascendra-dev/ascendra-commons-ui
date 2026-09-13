'use client';

import { useQuery } from '@tanstack/react-query';
import { BackLink, MainContent, PageHeader, PageHeaderGroup, PageSubtitle, PageTitle, SimpleAlert } from '@/ascendra-ui';
import { auditApi } from '../api/audit-api.client';
import type { AuditQueryResult } from '../api/audit-api.types';
import { AuditEventTable } from './_audit-event-table';

export interface AuditTraceScreenProps {
  correlationId: string;
  fetchTrace?: (correlationId: string) => Promise<AuditQueryResult>;
}

/** Reached only by clicking a correlation id elsewhere in audit-logging.ui — not nav. */
export function AuditTraceScreen({ correlationId, fetchTrace = auditApi.trace }: AuditTraceScreenProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-trace', correlationId],
    queryFn: () => fetchTrace(correlationId),
  });

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <BackLink href="/audit-log">Back to Audit Log</BackLink>
          <PageTitle>Trace</PageTitle>
          <PageSubtitle>{correlationId}</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <MainContent>
        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {isError && <SimpleAlert variant="destructive">Could not load this trace.</SimpleAlert>}
        {data && (
          <AuditEventTable
            records={data.records}
            emptyMessage="No audit events recorded under this correlation id."
          />
        )}
      </MainContent>
    </>
  );
}
