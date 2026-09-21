'use client';

import Link from 'next/link';
import { SimpleBadge, StatusDot } from '@/ascendra-ui';
import { dotVariantForEntityType } from '../../shared/timeline';
import { auditLogLinks } from '../links';
import type { AuditEvent } from '../api/audit-api.types';

/**
 * Shared by AuditEntityHistoryScreen and AuditTraceScreen — both render a
 * fixed set of events as a timeline (matching audit-logging.api/mocks.html's
 * `.timeline`/`.tl-item` sections), page-level composition using StatusDot +
 * SimpleBadge rather than a new shared "Timeline" component (no such
 * component exists in ascendra-ui yet — worth a BACKLOG.md suggestion if
 * this shape recurs in other modules' UIs).
 */
export function AuditEventTimeline({ records, emptyMessage }: { records: AuditEvent[]; emptyMessage: string }) {
  if (records.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  return (
    <ul className="border-border ml-1 flex flex-col gap-5 border-l pl-6">
      {records.map((row) => (
        <li key={row.id} className="relative">
          <StatusDot
            variant={dotVariantForEntityType(row.entityType)}
            className="absolute top-1.5 -left-[1.6rem]"
          />
          <div className="text-muted-foreground text-xs tabular-nums">
            {new Date(row.occurredAt).toLocaleString()}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm">
            <SimpleBadge>{row.action}</SimpleBadge>
            <Link href={auditLogLinks.eventDetail(row.id)} className="hover:underline">
              {row.entityType} / {row.entityId}
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link href={auditLogLinks.actorActivity(row.actor)} className="hover:underline">
              {row.actor}
            </Link>
          </div>
          {(row.reason || row.correlationId) && (
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
              {row.reason && <span>{row.reason}</span>}
              {row.reason && <span>·</span>}
              <Link href={auditLogLinks.trace(row.correlationId)} className="font-mono hover:underline">
                {row.correlationId}
              </Link>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
