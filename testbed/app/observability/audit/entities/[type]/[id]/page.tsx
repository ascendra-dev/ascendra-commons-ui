'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BackLink,
  MainContent,
  PageContent,
  PageHeader,
  PageHeaderGroup,
  PageMain,
  PageSubtitle,
  PageTitle,
  PageWrapper,
  SimpleAlert,
} from '@/ascendra-ui';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import { mockEntityHistory } from '@/ascendra-commons-ui/audit-logging.ui/mocks';
import { AuditEventTimeline } from '../../../_audit-event-timeline';

/** testbed has no live backend — using the mock fetcher (see page.tsx's own comment upstream). */
const fetchHistory = mockEntityHistory;

/** Reached only by clicking an entity elsewhere in the Audit Log — not nav. */
export default function AuditEntityHistoryPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-entity-history', type, id],
    queryFn: () => fetchHistory(type, id),
  });

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <BackLink href={auditLogLinks.list()}>Back to Audit Log</BackLink>
          <PageTitle>Entity History</PageTitle>
          <PageSubtitle>
            {type} / {id}
          </PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>
              {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
              {isError && (
                <SimpleAlert variant="destructive">Could not load this entity&apos;s history.</SimpleAlert>
              )}
              {data && (
                <AuditEventTimeline
                  records={data.records}
                  emptyMessage="Nothing has ever been recorded against this entity."
                />
              )}
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </>
  );
}
