'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { BackLink, MainContent, PageHeader, PageHeaderGroup, PageSubtitle, PageTitle, SimpleAlert } from '@/ascendra-ui';
import { auditApi } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import { AuditEventTimeline } from '../../../_audit-event-timeline';

/**
 * The one fetcher this page calls — real API by default. A consumer without
 * a live backend (e.g. testbed) swaps this for a mock from
 * `audit-logging.ui/mocks` instead of editing the page body.
 */
const fetchHistory = (entityType: string, entityId: string) => auditApi.entityHistory(entityType, entityId);

/** Reached only by clicking an entity elsewhere in the Audit Log — not nav. */
export default function AuditEntityHistoryPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-entity-history', type, id],
    queryFn: () => fetchHistory(type, id),
  });

  return (
    <>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <BackLink href={auditLogLinks.list()}>Back to Audit Log</BackLink>
          <PageTitle>Entity History</PageTitle>
          <PageSubtitle>
            {type} / {id}
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
