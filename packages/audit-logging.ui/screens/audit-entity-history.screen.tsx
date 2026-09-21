'use client';

import { useQuery } from '@tanstack/react-query';
import { BackLink, MainContent, PageHeader, PageHeaderGroup, PageSubtitle, PageTitle, SimpleAlert } from '@/ascendra-ui';
import { auditApi } from '../api/audit-api.client';
import { auditLogLinks } from '../links';
import type { AuditQueryResult } from '../api/audit-api.types';
import { AuditEventTimeline } from './_audit-event-timeline';

export interface AuditEntityHistoryScreenProps {
  entityType: string;
  entityId: string;
  fetchHistory?: (entityType: string, entityId: string) => Promise<AuditQueryResult>;
}

/** Reached only by clicking an entity in AuditLogListScreen or AuditEventDetailScreen — not nav. */
export function AuditEntityHistoryScreen({
  entityType,
  entityId,
  fetchHistory = (t, id) => auditApi.entityHistory(t, id),
}: AuditEntityHistoryScreenProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-entity-history', entityType, entityId],
    queryFn: () => fetchHistory(entityType, entityId),
  });

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <BackLink href={auditLogLinks.list()}>Back to Audit Log</BackLink>
          <PageTitle>Entity History</PageTitle>
          <PageSubtitle>
            {entityType} / {entityId}
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <MainContent>
        {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
        {isError && <SimpleAlert variant="destructive">Could not load this entity's history.</SimpleAlert>}
        {data && (
          <AuditEventTimeline
            records={data.records}
            emptyMessage="Nothing has ever been recorded against this entity."
          />
        )}
      </MainContent>
    </>
  );
}
