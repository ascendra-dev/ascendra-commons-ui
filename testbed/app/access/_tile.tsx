'use client';

import Link from 'next/link';
import { LuArrowUpRight } from 'react-icons/lu';
import { Card, CardPanel, KpiCaption, KpiLabel, KpiTile, KpiValue, NormalState, Skeleton, SkeletonState, WithSkeleton } from '@/ascendra-ui';
import { cn } from '@/ascendra-ui/shadcn';
import { formatCount } from '@/ascendra-ui/utils/common.util';

export type Tone = 'warn' | 'alert' | undefined;

/** One Overview number — a link when a list can show exactly what it counted (the observability overviews' tile). */
export function Tile({
  label,
  value,
  caption,
  tone,
  href,
  loading,
}: {
  label: string;
  /** `null` when its read failed or isn't wired — a dash, never a confident 0. */
  value: number | null;
  caption: string;
  tone?: Tone;
  href?: string;
  loading: boolean;
}) {
  const card = (
    <Card className="h-full">
      <CardPanel>
        <KpiTile>
          <KpiLabel className="flex items-center justify-between gap-2">
            {label}
            {href && <LuArrowUpRight className="text-muted-foreground group-hover:text-foreground size-3.5 shrink-0 transition-colors" />}
          </KpiLabel>
          <div className="mt-auto pt-4">
            <WithSkeleton>
              <SkeletonState if={loading}>
                <Skeleton className="h-8 w-24" />
              </SkeletonState>
              <NormalState if={!loading}>
                <KpiValue className={cn(tone === 'warn' && 'text-orange-600 dark:text-orange-400', tone === 'alert' && 'text-negative')}>
                  {value == null ? '—' : formatCount(value)}
                </KpiValue>
              </NormalState>
            </WithSkeleton>
          </div>
          <KpiCaption className="text-muted-foreground/60 mt-1 text-[0.6875rem]">{caption}</KpiCaption>
        </KpiTile>
      </CardPanel>
    </Card>
  );
  return href ? (
    <Link href={href} aria-label={`${label} — open the list`} className="group focus-visible:outline-primary block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2">
      {card}
    </Link>
  ) : (
    <div className="h-full">{card}</div>
  );
}
