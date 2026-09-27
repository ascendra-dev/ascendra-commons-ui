'use client';

import {
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
  WithCopyText,
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';

interface DiffLine {
  key: string;
  kind: 'removed' | 'added' | 'unchanged';
  text: string;
}

/**
 * One line per field, matching audit-logging.api/mocks.html's own
 * before → after block: an unchanged field shows once, a changed one shows
 * as a removed line (old value) followed by an added line (new value).
 * Presentation-only — distinct from the API's own changed-only `diff[]`
 * contract (FieldDiffEntry), which this doesn't need since every field is
 * already in hand on the row.
 */
function buildDiffLines(before: Record<string, unknown> | null, after: Record<string, unknown> | null): DiffLine[] {
  const b = before ?? {};
  const a = after ?? {};
  const fields = [...new Set([...Object.keys(b), ...Object.keys(a)])];

  // Changed fields first (what actually happened), unchanged fields after as
  // trailing context — matches audit-logging.api/mocks.html's own example,
  // which orders status/paidAt (changed) before amount/currency (unchanged).
  const changed: DiffLine[] = [];
  const unchanged: DiffLine[] = [];

  for (const field of fields) {
    const hasBefore = field in b;
    const hasAfter = field in a;
    const isUnchanged = hasBefore && hasAfter && JSON.stringify(b[field]) === JSON.stringify(a[field]);

    if (isUnchanged) {
      unchanged.push({ key: field, kind: 'unchanged', text: `${field}: ${JSON.stringify(a[field])}` });
      continue;
    }
    if (hasBefore) changed.push({ key: `${field}-before`, kind: 'removed', text: `${field}: ${JSON.stringify(b[field])}` });
    if (hasAfter) changed.push({ key: `${field}-after`, kind: 'added', text: `${field}: ${JSON.stringify(a[field])}` });
  }

  return [...changed, ...unchanged];
}

/**
 * Shared by every screen that lets a user drill into one record (Audit Log
 * list, Entity History, Trace timeline) — local overlay state on the
 * calling page, not a route. Only mounted while there's a record to show
 * (see call sites' `{selected && <AuditEventDetailSheet ... />}`), so
 * `record` is required and there's nothing to guard against internally.
 */
export function AuditEventDetailSheet({ record, onClose }: { record: AuditEvent; onClose: () => void }) {
  const diffLines = buildDiffLines(record.before, record.after);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Audit record detail</SheetTitle>
          <SheetDescription>What changed on this record, when it happened, and who made the change.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <SheetSection>
            <SheetProperties>
              <SheetKey>Record id</SheetKey>
              <SheetValue className="font-mono">
                <WithCopyText value={record.id} showTooltip>
                  {record.id}
                </WithCopyText>
              </SheetValue>

              <SheetKey>Occurred at</SheetKey>
              <SheetValue>{formatDateTime(record.occurredAt, { time: true })}</SheetValue>

              <SheetKey>Actor</SheetKey>
              <SheetValue>{record.actor}</SheetValue>

              <SheetKey>Action</SheetKey>
              <SheetValue>
                <SimpleBadge>{record.action}</SimpleBadge>
              </SheetValue>

              <SheetKey>Entity</SheetKey>
              <SheetValue>
                <div className="flex flex-col gap-0.5">
                  <SimpleBadge variant="secondary" className="w-fit">
                    {record.entityType}
                  </SimpleBadge>
                  <WithCopyText value={record.entityId} showTooltip>
                    <span className="font-mono text-xs">{record.entityId}</span>
                  </WithCopyText>
                </div>
              </SheetValue>

              <SheetKey>Tenant</SheetKey>
              <SheetValue>{record.tenantId ?? <SimpleBadge variant="info">platform</SimpleBadge>}</SheetValue>

              <SheetKey>Correlation</SheetKey>
              <SheetValue className="font-mono">
                <WithCopyText value={record.correlationId} showTooltip>
                  {record.correlationId}
                </WithCopyText>
              </SheetValue>

              {record.reason && (
                <>
                  <SheetKey>Reason</SheetKey>
                  <SheetValue>{record.reason}</SheetValue>
                </>
              )}
            </SheetProperties>
          </SheetSection>

          <SheetSection>
            <SheetSectionHeader>Before → after</SheetSectionHeader>
            {diffLines.length === 0 ? (
              <p className="text-muted-foreground text-sm">No field-level changes recorded.</p>
            ) : (
              <div className="border-border bg-muted rounded-md border p-3 font-mono text-xs">
                {diffLines.map((line) => (
                  <div
                    key={line.key}
                    className={
                      line.kind === 'removed'
                        ? 'text-negative'
                        : line.kind === 'added'
                          ? 'text-positive'
                          : 'text-muted-foreground'
                    }
                  >
                    {line.kind === 'removed' ? '- ' : line.kind === 'added' ? '+ ' : '  '}
                    {line.text}
                  </div>
                ))}
              </div>
            )}
          </SheetSection>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
