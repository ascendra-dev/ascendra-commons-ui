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
import { mockTrace } from '@/ascendra-commons-ui/audit-logging.ui/mocks';
import { AuditEventTimeline } from '../../_audit-event-timeline';

/** testbed has no live backend — using the mock fetcher (see page.tsx's own comment upstream). */
const fetchTrace = mockTrace;

/** Reached only by clicking a correlation id elsewhere in the Audit Log — not nav. */
export default function AuditTracePage() {
  const { correlationId } = useParams<{ correlationId: string }>();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-trace', correlationId],
    queryFn: () => fetchTrace(correlationId),
  });

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <BackLink href={auditLogLinks.list()}>Back to Audit Log</BackLink>
          <PageTitle>Request / Job Trace</PageTitle>
          <PageSubtitle>{correlationId}</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>
        <PageWrapper>
          <PageContent>
            <MainContent>
              {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
              {isError && <SimpleAlert variant="destructive">Could not load this trace.</SimpleAlert>}
              {data && (
                <AuditEventTimeline
                  records={data.records}
                  emptyMessage="No audit events recorded under this correlation id."
                />
              )}
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
    </>
  );
}
