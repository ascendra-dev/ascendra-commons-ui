'use client';

import type { ReactNode } from 'react';
import {
  IdText,
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
} from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { flattenPaths } from '@/ascendra-commons-ui/audit-logging.ui/api';
import type { AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';

interface DiffLine {
  key: string;
  kind: 'removed' | 'added' | 'unchanged';
  text: string;
}

/**
 * One line per leaf, matching audit-logging.api/mocks.html's own
 * before → after block: an unchanged leaf shows once, a changed one shows
 * as a removed line (old value) followed by an added line (new value).
 * Nested objects are flattened to dot paths (`address.street`) and arrays are
 * shown whole — the same rules as the API's changed-only `diff[]`, which this
 * doesn't fetch since every field is already in hand on the row.
 */
function buildDiffLines(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): DiffLine[] {
  const b = flattenPaths(before ?? {});
  const a = flattenPaths(after ?? {});
  const paths = [...new Set([...b.keys(), ...a.keys()])];

  // Changed leaves first (what actually happened), unchanged leaves after as
  // trailing context — matches audit-logging.api/mocks.html's own example,
  // which orders status/paidAt (changed) before amount/currency (unchanged).
  const changed: DiffLine[] = [];
  const unchanged: DiffLine[] = [];

  for (const path of paths) {
    const hasBefore = b.has(path);
    const hasAfter = a.has(path);
    const isUnchanged =
      hasBefore &&
      hasAfter &&
      JSON.stringify(b.get(path)) === JSON.stringify(a.get(path));

    if (isUnchanged) {
      unchanged.push({
        key: path,
        kind: 'unchanged',
        text: `${path}: ${JSON.stringify(a.get(path))}`,
      });
      continue;
    }
    if (hasBefore)
      changed.push({
        key: `${path}-before`,
        kind: 'removed',
        text: `${path}: ${JSON.stringify(b.get(path))}`,
      });
    if (hasAfter)
      changed.push({
        key: `${path}-after`,
        kind: 'added',
        text: `${path}: ${JSON.stringify(a.get(path))}`,
      });
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
export function AuditEventDetailSheet({
  record,
  onClose,
  navigator,
}: {
  record: AuditEvent;
  onClose: () => void;
  /** Previous/next control, e.g. a DataTableSheetNavigator — omitted where the sheet shows a lone record. */
  navigator?: ReactNode;
}) {
  const diffLines = buildDiffLines(record.before, record.after);

  return (
    // The page behind keeps scrolling; an outside click only closes the sheet.
    <Sheet open lockScroll={false} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        {navigator}
        <SheetHeader>
          <SheetTitle>Audit record detail</SheetTitle>
          <SheetDescription>
            What changed on this record, when it happened, and who made the
            change.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <SheetSection>
            <SheetProperties>
              <SheetKey>Record id</SheetKey>
              <SheetValue>
                <IdText value={record.id} showTooltip={false} />
              </SheetValue>

              <SheetKey>Occurred at</SheetKey>
              <SheetValue>
                {formatDateTime(record.occurredAt, { time: true })}
              </SheetValue>

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
                  <IdText value={record.entityId} showTooltip={false} />
                </div>
              </SheetValue>

              <SheetKey>Tenant</SheetKey>
              <SheetValue>
                {record.tenantId ?? (
                  <SimpleBadge variant="info">platform</SimpleBadge>
                )}
              </SheetValue>

              <SheetKey>Correlation</SheetKey>
              <SheetValue>
                <IdText value={record.correlationId} showTooltip={false} />
              </SheetValue>

              <SheetKey>Application</SheetKey>
              <SheetValue>{record.application}</SheetValue>

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
              <p className="text-muted-foreground text-sm">
                No field-level changes recorded.
              </p>
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
                    {line.kind === 'removed'
                      ? '- '
                      : line.kind === 'added'
                        ? '+ '
                        : '  '}
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
