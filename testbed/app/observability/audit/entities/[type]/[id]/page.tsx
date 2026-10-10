'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BackLink,
  Button,
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
import { mockEntityHistory, mockEntityNeighbors } from '@/ascendra-commons-ui/audit-logging.ui/mocks';
import type { AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';
import { dotVariantForAction } from '@/ascendra-commons-ui/shared/timeline';
import { AuditEventTimeline } from '../../../_audit-event-timeline';
import { AuditEventDetailSheet } from '../../../_audit-event-detail-sheet';

/** testbed has no live backend — using the mock fetchers (see page.tsx's own comment upstream). */
const fetchHistory = mockEntityHistory;
const fetchNeighbors = mockEntityNeighbors;

/**
 * Reached only by clicking an entity elsewhere in the Audit Log — not nav.
 *
 * Newer/Older navigate between *entities* of the same type, ordered by last
 * activity — not batches of this one entity's own events, which is
 * normally short enough to show in full (see EntityNeighbors' own doc
 * comment for why: one entity's trail is rarely long, but working through
 * every entity of a type in turn — every flagged invoice, every changed
 * user — is a real review workflow). Clicking either is a real route
 * change to a different entity id, so the destination page's own
 * `isLoading` covers the loading state — no button-level spinner needed
 * here, unlike a same-page data swap.
 */
export default function AuditEntityHistoryPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-entity-history', type, id],
    queryFn: () => fetchHistory(type, id),
  });

  const tenantId = data?.data[0]?.tenantId;
  const { data: neighbors } = useQuery({
    queryKey: ['audit-entity-neighbors', type, id, tenantId],
    queryFn: () => fetchNeighbors(type, id, tenantId),
    enabled: data !== undefined,
  });

  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <BackLink href={auditLogLinks.list()}>Back to Audit Log</BackLink>
          <PageTitle>Entity History</PageTitle>
          <PageSubtitle>
            {type} / {id}
            {data && ` · ${tenantId ?? 'platform'}`}
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
                <>
                  <AuditEventTimeline
                    records={data.data}
                    emptyMessage="Nothing has ever been recorded against this entity."
                    onEventClick={setSelected}
                    dotVariant={(row) => dotVariantForAction(row.action)}
                  />
                  {neighbors && (
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-muted-foreground text-xs">
                        {neighbors.totalRecords} {type} records
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button variant="secondary" size="sm" disabled={!neighbors.newer} asChild={!!neighbors.newer}>
                          {neighbors.newer ? (
                            <Link href={auditLogLinks.entityHistory(type, neighbors.newer.entityId)}>Newer</Link>
                          ) : (
                            <span>Newer</span>
                          )}
                        </Button>
                        <Button variant="secondary" size="sm" disabled={!neighbors.older} asChild={!!neighbors.older}>
                          {neighbors.older ? (
                            <Link href={auditLogLinks.entityHistory(type, neighbors.older.entityId)}>Older</Link>
                          ) : (
                            <span>Older</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </MainContent>
          </PageContent>
        </PageWrapper>
      </PageMain>
      {selected && <AuditEventDetailSheet record={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
