'use client';

import Link from 'next/link';
import { IdText, SimpleBadge, StatusDot } from '@/ascendra-ui';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import type { TimelineDotVariant } from '@/ascendra-commons-ui/shared/timeline';
import { auditLogLinks } from '@/ascendra-commons-ui/audit-logging.ui/links';
import type { AuditEvent } from '@/ascendra-commons-ui/audit-logging.ui/api';

/**
 * Shared by the Entity History and Trace pages — both render a fixed set of
 * events as a timeline (matching `audit-logging.api/mocks.html`'s
 * `.timeline`/`.tl-item` sections), page-level composition using StatusDot +
 * SimpleBadge rather than a shared "Timeline" component (none exists in
 * ascendra-ui yet — worth a BACKLOG.md suggestion if this shape recurs in
 * other modules).
 *
 * `onEventClick` opens the caller's own local-state detail Sheet (see
 * AuditEventDetailSheet) instead of navigating — each row here already
 * carries the full AuditEvent, so there's nothing to fetch.
 *
 * `dotVariant` is supplied by the caller rather than fixed here: Trace
 * mixes several entities under one correlation id, where coloring by
 * entityType (dotVariantForEntityType) actually varies row to row; Entity
 * History is scoped to one fixed entity, where that same dimension is
 * constant across every row — coloring by action instead
 * (dotVariantForAction) is what varies there. See shared/timeline's own
 * doc comments for why entityType/action are the honest choices for each.
 */
export function AuditEventTimeline({
  records,
  emptyMessage,
  onEventClick,
  dotVariant,
}: {
  records: AuditEvent[];
  emptyMessage: string;
  onEventClick: (row: AuditEvent) => void;
  dotVariant: (row: AuditEvent) => TimelineDotVariant;
}) {
  if (records.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <ul className="border-border ml-1 flex flex-col gap-5 border-l pl-6">
      {records.map((row) => (
        <li key={row.id} className="relative">
          <StatusDot
            variant={dotVariant(row)}
            className="absolute top-[4px] -left-[27px]"
          />
          <div className="text-muted-foreground text-xs tabular-nums">
            {formatDateTime(row.occurredAt, { time: true })}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm">
            <SimpleBadge>{row.action}</SimpleBadge>
            <button
              type="button"
              onClick={() => onEventClick(row)}
              className="cursor-pointer hover:underline"
            >
              {row.entityType} / {row.entityId}
            </button>
            <span className="text-muted-foreground">·</span>
            <Link
              href={auditLogLinks.actorActivity(row.actor)}
              className="hover:underline"
            >
              {row.actor}
            </Link>
          </div>
          {(row.reason || row.correlationId) && (
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
              {row.reason && <span>Reason: {row.reason}</span>}
              {row.reason && <span>·</span>}
              <span className="flex items-center gap-1">
                Correlation:
                <Link
                  href={auditLogLinks.trace(row.correlationId)}
                  className="hover:underline"
                >
                  <IdText
                    value={row.correlationId}
                    copyable={false}
                    showTooltip={false}
                  />
                </Link>
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
