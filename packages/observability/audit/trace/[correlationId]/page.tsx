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
import { auditApi } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import { AuditEventTimeline } from '../../_audit-event-timeline';

/**
 * The one fetcher this page calls — real API by default. A consumer without
 * a live backend (e.g. testbed) swaps this for a mock from
 * `audit-logging.ui/mocks` instead of editing the page body.
 */
const fetchTrace = auditApi.trace;

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
