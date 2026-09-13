'use client';

import Link from 'next/link';
import {
  Empty,
  EmptyBody,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableWrapper,
} from '@/ascendra-ui';
import { LuTextSearch } from 'react-icons/lu';
import { auditLogLinks } from '../links';
import type { AuditEvent } from '../api/audit-api.types';

/**
 * Shared by AuditEntityHistoryScreen and AuditTraceScreen — both are a fixed,
 * non-editable filter (one entity, one correlation id), so a Simple Table is
 * the right tier here (see create-table.md's decision tree), not the full
 * data-table-lab query system AuditLogListScreen uses.
 */
export function AuditEventTable({ records, emptyMessage }: { records: AuditEvent[]; emptyMessage: string }) {
  return (
    <TableWrapper>
      <Table>
        <TableHeader>
          <TableHeaderRow>
            <TableHead>Event ID</TableHead>
            <TableHead>Occurred</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Correlation ID</TableHead>
          </TableHeaderRow>
        </TableHeader>
        {records.length > 0 && (
          <TableBody>
            {records.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link href={auditLogLinks.eventDetail(row.id)} className="text-primary hover:underline">
                    {row.id}
                  </Link>
                </TableCell>
                <TableCell>{new Date(row.occurredAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Link
                    href={auditLogLinks.entityHistory(row.entityType, row.entityId)}
                    className="text-primary hover:underline"
                  >
                    {row.entityType} / {row.entityId}
                  </Link>
                </TableCell>
                <TableCell>{row.actor}</TableCell>
                <TableCell>{row.action}</TableCell>
                <TableCell>
                  <Link href={auditLogLinks.trace(row.correlationId)} className="text-primary hover:underline">
                    {row.correlationId}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
      {records.length === 0 && (
        <EmptyBody>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LuTextSearch strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No matching audit records</EmptyTitle>
              <EmptyDescription>{emptyMessage}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </EmptyBody>
      )}
    </TableWrapper>
  );
}
