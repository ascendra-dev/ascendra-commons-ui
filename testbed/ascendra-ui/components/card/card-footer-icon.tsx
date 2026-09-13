import * as React from 'react';
import { InfoIcon } from 'lucide-react';
import { cn } from '@/ascendra-ui/shadcn';

type IconType = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

export function CardFooterIcon({
  icon: Icon = InfoIcon,
  className,
}: {
  icon?: IconType;
  className?: string;
}) {
  return (
    <Icon
      className={cn('mt-0.5 mr-2 size-3 shrink-0', className)}
      strokeWidth={2.5}
    />
  );
}
