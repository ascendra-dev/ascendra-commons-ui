'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  CopyText,
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
  SimpleAlert,
  SimpleBadge,
} from '@/ascendra-ui';
import { auditApi } from '../api/audit-api.client';
import { auditLogLinks } from '../links';
import type { AuditEventDetail } from '../api/audit-api.types';

export interface AuditEventDetailScreenProps {
  eventId: string;
  fetchDetail?: (id: string) => Promise<AuditEventDetail>;
}

/**
 * Reached only by clicking a row in AuditLogListScreen — a permalink
 * (`../audit-logging.core/audit-event-reader.port.ts`'s own doc comment
 * calls the record id one), so this stays its own route rather than local
 * sheet-open state on the list page — the usual ascendra-ui Sheet pattern
 * (`create-sheet.md`'s "Table row" trigger). Simpler middle ground: it's
 * *styled* as a Sheet (open, slide-in, the built-in close X) but reached by
 * navigation, not a true modal-over-the-list. Upgrade to a real intercepting
 * route later if the slide-over-preserving-the-list-underneath UX matters
 * enough to justify the added routing complexity.
 */
export function AuditEventDetailScreen({ eventId, fetchDetail = auditApi.getEvent }: AuditEventDetailScreenProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-event-detail', eventId],
    queryFn: () => fetchDetail(eventId),
  });

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Record detail</SheetTitle>
          <SheetDescription>
            Opened from a row in the Audit Log — a permalink to one record, with its before → after diff.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {isError && <SimpleAlert variant="destructive">Could not load this audit record.</SimpleAlert>}
          {data && (
            <>
              <SheetSection>
                <SheetProperties>
                  <SheetKey>Record id</SheetKey>
                  <SheetValue className="font-mono">
                    <CopyText value={data.id} showTooltip>
                      {data.id}
                    </CopyText>
                  </SheetValue>

                  <SheetKey>Occurred at</SheetKey>
                  <SheetValue>{new Date(data.occurredAt).toLocaleString()}</SheetValue>

                  <SheetKey>Actor</SheetKey>
                  <SheetValue>
                    <a
                      className="cursor-pointer hover:underline"
                      onClick={() => router.push(auditLogLinks.actorActivity(data.actor))}
                    >
                      {data.actor}
                    </a>
                  </SheetValue>

                  <SheetKey>Action</SheetKey>
                  <SheetValue>
                    <SimpleBadge>{data.action}</SimpleBadge>
                  </SheetValue>

                  <SheetKey>Entity</SheetKey>
                  <SheetValue>
                    <a
                      className="flex w-fit cursor-pointer items-center gap-1.5 hover:underline"
                      onClick={() => router.push(auditLogLinks.entityHistory(data.entityType, data.entityId))}
                    >
                      <SimpleBadge variant="secondary">{data.entityType}</SimpleBadge>
                      <span className="font-mono text-xs">{data.entityId}</span>
                    </a>
                  </SheetValue>

                  <SheetKey>Tenant</SheetKey>
                  <SheetValue>{data.tenantId ?? <SimpleBadge variant="info">platform</SimpleBadge>}</SheetValue>

                  <SheetKey>Correlation</SheetKey>
                  <SheetValue className="flex items-center gap-1.5 font-mono">
                    <CopyText value={data.correlationId} showTooltip>
                      {data.correlationId}
                    </CopyText>
                    <a
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => router.push(auditLogLinks.trace(data.correlationId))}
                    >
                      View trace
                    </a>
                  </SheetValue>

                  {data.reason && (
                    <>
                      <SheetKey>Reason</SheetKey>
                      <SheetValue>{data.reason}</SheetValue>
                    </>
                  )}
                </SheetProperties>
              </SheetSection>

              <SheetSection>
                <SheetSectionHeader>Before → after</SheetSectionHeader>
                {data.diff.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No field-level changes recorded.</p>
                ) : (
                  <div className="border-border bg-muted rounded-md border p-3 font-mono text-xs">
                    {data.diff.map((entry) => (
                      <div key={entry.field} className="py-0.5">
                        <span className="text-muted-foreground">{entry.field}: </span>
                        <span className="text-negative">{JSON.stringify(entry.before)}</span>
                        <span> → </span>
                        <span className="text-positive">{JSON.stringify(entry.after)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </SheetSection>
            </>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
