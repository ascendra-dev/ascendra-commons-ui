'use client';

import { useState } from 'react';
import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@/ascendra-ui/shadcn';
import { LuCopy, LuCheck, LuCopyCheck } from 'react-icons/lu';

type CopyTextProps = {
  value?: string;
  opaque?: boolean;
  timeout?: number;
  showTooltip?: boolean;
  onClick?: (
    event: React.MouseEvent<HTMLSpanElement>
  ) => void | Promise<string>;
};

export function CopyText({
  value,
  opaque = false,
  timeout = 1200,
  showTooltip = false,
  onClick,
  className,
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'span'>, 'onClick'> & CopyTextProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLSpanElement>) => {
    let text = value;
    if (onClick) {
      const result = await onClick(e);
      if (result) text = result;
    }
    if (text) {
      console.log('text is: ', text);
      await navigator.clipboard.writeText(text);
    }
    /* if (onClick) {
      const val = await onClick(e);
      // await navigator.clipboard.writeText(val);
    } else {
      await navigator.clipboard.writeText(value);
    } */

    setCopied(true);
    if (showTooltip) setOpen(true);

    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, timeout);
  };

  const trigger = (
    <span
      onClick={handleCopy}
      onMouseEnter={() => showTooltip && setOpen(true)}
      onMouseLeave={() => showTooltip && setOpen(false)}
      className={cn(
        'group/tt inline-flex cursor-copy items-center gap-1 select-none',
        className
      )}
      {...props}
    >
      {children ?? value}
      <span className="flex h-4 w-4 items-center justify-center">
        {copied ? (
          <LuCopyCheck className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <LuCopy
            className={cn(
              'h-3.5 w-3.5 transition-opacity group-hover/row:opacity-100 group-hover/tt:opacity-100',
              !opaque && 'opacity-0'
            )}
          />
        )}
      </span>
    </span>
  );

  if (!showTooltip) return trigger;

  return (
    <Tooltip open={open}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>

      <TooltipContent className="flex items-center gap-1">
        {copied ? (
          <>
            <span>Copied</span>
            <LuCheck />
          </>
        ) : (
          <span>Copy</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
