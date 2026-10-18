'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ErrorState,
  NormalState,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetKey,
  SheetProperties,
  SheetSection,
  SheetSectionHeader,
  SheetTitle,
  SheetValue,
  SimpleBadge,
  SimpleTable,
  SimpleTableBody,
  SimpleTableCell,
  SimpleTableHead,
  SimpleTableHeader,
  SimpleTableRow,
  Skeleton,
  SkeletonState,
  WithEmptyValue,
  WithSkeleton,
  WithState,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { auditApi, type ActorActivitySummary } from '@/ascendra-commons-ui/audit-logging.ui/api';

/** The real audit API (`NEXT_PUBLIC_API_URL` — ascendra-commons-sandbox in the testbed). */
const fetchActivity = auditApi.actorActivity;

const PROPERTY_KEYS = ['First seen', 'Last seen', 'Total records', 'Tenants touched'];
const SKELETON_ACTION_ROWS = 3;

/**
 * One actor's all-time activity summary — opened from an actor in the Audit
 * Log list. The actor comes from a record, so it always has activity: no
 * records back means the actor can't be found (or isn't visible), which shows
 * as the error state, not an empty one.
 */
export function AuditActorActivitySheet({
  actor,
  onClose,
}: {
  actor: string;
  onClose: () => void;
}) {
  const { data, isError, error, refetch } = useQuery({
    queryKey: ['audit-actor-activity', actor],
    queryFn: async () => {
      const summary = await fetchActivity(actor);
      if (summary.totalRecords === 0) throw new Error('No activity was found for this actor.');
      return summary;
    },
  });

  return (
    // The page behind keeps scrolling; an outside click only closes the sheet.
    <Sheet open lockScroll={false} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Actor activity</SheetTitle>
          <SheetDescription>{actor}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <WithState>
            <ErrorState
              if={isError}
              title="Couldn't load this actor's activity"
              error={error}
              onRetry={() => refetch()}
            />
            <NormalState if={!isError}>
              <WithSkeleton>
                <SkeletonState if={!data}>
                  <SheetSection>
                    <SheetProperties>
                      {PROPERTY_KEYS.map((key) => (
                        <PropertySkeleton key={key} label={key} />
                      ))}
                    </SheetProperties>
                  </SheetSection>
                  <SheetSection>
                    <SheetSectionHeader>By action</SheetSectionHeader>
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: SKELETON_ACTION_ROWS }, (_, i) => (
                        <Skeleton key={i} className="h-5 w-full" />
                      ))}
                    </div>
                  </SheetSection>
                </SkeletonState>
                <NormalState if={!!data}>
                  {data && <ActivitySummary data={data} />}
                </NormalState>
              </WithSkeleton>
            </NormalState>
          </WithState>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function PropertySkeleton({ label }: { label: string }) {
  return (
    <>
      <SheetKey>{label}</SheetKey>
      <SheetValue>
        <Skeleton className="h-5 w-32" />
      </SheetValue>
    </>
  );
}

function ActivitySummary({ data }: { data: ActorActivitySummary }) {
  return (
    <>
      <SheetSection>
        <SheetProperties>
          <SheetKey>First seen</SheetKey>
          <SheetValue>
            <WithEmptyValue value={data.firstSeen}>
              {data.firstSeen && formatDateTime(data.firstSeen, { style: 'relative' })}
            </WithEmptyValue>
          </SheetValue>

          <SheetKey>Last seen</SheetKey>
          <SheetValue>
            <WithEmptyValue value={data.lastSeen}>
              {data.lastSeen && formatDateTime(data.lastSeen, { style: 'relative' })}
            </WithEmptyValue>
          </SheetValue>

          <SheetKey>Total records</SheetKey>
          <SheetValue>{data.totalRecords}</SheetValue>

          <SheetKey>Tenants touched</SheetKey>
          <SheetValue>
            <div className="flex flex-wrap items-center gap-1.5">
              {data.tenantsTouched.map((tenantId) =>
                tenantId === null ? (
                  <SimpleBadge key="platform" variant="info">
                    platform
                  </SimpleBadge>
                ) : (
                  <span key={tenantId}>{tenantId}</span>
                ),
              )}
            </div>
          </SheetValue>
        </SheetProperties>
      </SheetSection>

      <SheetSection>
        <SheetSectionHeader>By action</SheetSectionHeader>
        <SimpleTable>
          <SimpleTableHeader>
            <SimpleTableHead>Entity</SimpleTableHead>
            <SimpleTableHead>Action</SimpleTableHead>
            <SimpleTableHead className="text-right">Count</SimpleTableHead>
            <SimpleTableHead>Last</SimpleTableHead>
          </SimpleTableHeader>
          <SimpleTableBody>
            {data.byAction.map((row) => (
              <SimpleTableRow key={`${row.entityType}/${row.action}`}>
                <SimpleTableCell>
                  <SimpleBadge variant="secondary">{row.entityType}</SimpleBadge>
                </SimpleTableCell>
                <SimpleTableCell>
                  <SimpleBadge>{row.action}</SimpleBadge>
                </SimpleTableCell>
                <SimpleTableCell className="text-right tabular-nums">{row.count}</SimpleTableCell>
                <SimpleTableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDateTime(row.lastOccurredAt, { style: 'relative' })}
                </SimpleTableCell>
              </SimpleTableRow>
            ))}
          </SimpleTableBody>
        </SimpleTable>
      </SheetSection>
    </>
  );
}
