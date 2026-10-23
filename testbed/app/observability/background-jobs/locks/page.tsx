'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BackLink,
  CardHeaderSubtitle,
  CardHeaderTitle,
  DashboardContent,
  DataTableEmptyBody,
  DataTableErrorBody,
  DataTableLoadingBody,
  IdText,
  PageHeader,
  PageHeaderGroup,
  PageSubtitle,
  PageTitle,
  SimpleBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeaderRow,
  TableRow,
  TableRowLink,
  TableWrapper,
  useBackTo,
} from '@/ascendra-ui';
import { Separator } from '@/ascendra-ui/shadcn';
import { formatDateTime } from '@/ascendra-ui/utils/common.util';
import { backgroundJobsApi } from '@/ascendra-commons-ui/background-jobs.ui/api';
import { backgroundJobsLinks } from '@/ascendra-commons-ui/background-jobs.ui/links';

const STATE = {
  held: { label: 'held — running', variant: 'blue' },
  expired: { label: 'expired — holder died', variant: 'red' },
} as const;

/**
 * Which job locks are taken right now — a run in progress, or one a crashed process left behind. A released lock's
 * row is deleted, so every row is one or the other. Read-only: no force-release. Reached via the Overview's header.
 */
export default function BackgroundJobLocksPage() {
  const backTo = useBackTo('locks');
  const locks = useQuery({ queryKey: ['background-jobs-locks'], queryFn: () => backgroundJobsApi.locks() });
  const rows = locks.data?.locks ?? [];
  const unsupported = locks.data?.supported === false;

  return (
    <>
      <BackLink href={backgroundJobsLinks.overview()}>Back to overview</BackLink>
      <PageHeader variant="dashboard">
        <PageHeaderGroup>
          <PageTitle>Locks</PageTitle>
          <PageSubtitle>Which job locks are taken right now — a run in progress, or one a crashed process left behind.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <DashboardContent>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableHeaderRow size="lg">
                <TableHead colSpan={5} className="whitespace-normal">
                  <CardHeaderTitle>Lease locks</CardHeaderTitle>
                  <CardHeaderSubtitle>
                    Expired: its holder died mid-run — the next run takes it over, but that run was never recorded
                  </CardHeaderSubtitle>
                </TableHead>
              </TableHeaderRow>
              {rows.length > 0 && (
                <>
                  {/* Divides the card's title from the column labels below it. */}
                  <TableHeaderRow aria-hidden className="h-auto">
                    <TableHead colSpan={5} className="p-0 first:pl-0">
                      <Separator />
                    </TableHead>
                  </TableHeaderRow>
                  <TableHeaderRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Holder</TableHead>
                    <TableHead>Taken</TableHead>
                    <TableHead>Lease until</TableHead>
                    <TableHead>State</TableHead>
                  </TableHeaderRow>
                </>
              )}
            </TableHeader>
            {rows.length > 0 && (
              <TableBody>
                {rows.map((lock) => (
                  <TableRow key={lock.lockKey}>
                    <TableCell>
                      {lock.jobName ? (
                        <TableRowLink href={backTo(backgroundJobsLinks.job(lock.jobName))}>
                          <SimpleBadge>{lock.jobName}</SimpleBadge>
                        </TableRowLink>
                      ) : (
                        <SimpleBadge>{lock.lockKey}</SimpleBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      <IdText value={lock.holder} className="text-muted-foreground" showTooltip={false} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(lock.acquiredAt, { style: 'short', time: true })}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(lock.lockedUntil, { style: 'short', time: true })}</TableCell>
                    <TableCell>
                      <SimpleBadge variant={STATE[lock.state].variant}>{STATE[lock.state].label}</SimpleBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
          <DataTableLoadingBody isLoading={locks.isLoading} className="h-65" />
          <DataTableErrorBody isError={locks.isError} error={locks.error} onRetry={() => locks.refetch()} className="h-65" />
          <DataTableEmptyBody
            isLoading={locks.isLoading}
            isEmpty={!!locks.data && rows.length === 0}
            title={unsupported ? "This app's lock can't be listed" : 'No locks taken'}
            description={
              unsupported
                ? 'It uses Postgres advisory locks, which leave nothing to read. Switch to the lease lock to see locks here.'
                : 'No job is running right now, and none was left behind.'
            }
            className="h-65"
          />
        </TableWrapper>
      </DashboardContent>
    </>
  );
}
