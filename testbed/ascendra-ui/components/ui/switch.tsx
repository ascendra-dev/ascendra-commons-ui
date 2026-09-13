'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive } from 'radix-ui';

import { cn } from '@/ascendra-ui/shadcn';

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer group/switch',
        'relative top-px inline-flex w-6 shrink-0 items-center justify-start rounded-full p-0.5',
        'ring-1 data-[state=checked]:ring-purple-800/88 data-[state=unchecked]:ring-(--color-umbra)/20 dark:data-[state=checked]:ring-purple-600 dark:data-[state=unchecked]:ring-white/15',
        'data-[state=checked]:bg-primary',
        'data-[state=unchecked]:bg-gray-300 data-[state=unchecked]:hover:bg-gray-400 data-[state=unchecked]:hover:ring-gray-400 dark:data-[state=unchecked]:bg-(--color-gray-1000) dark:data-[state=unchecked]:hover:bg-gray-900',
        'data-[state=checked]:hover:bg-purple-800 dark:data-[state=checked]:hover:bg-(--color-purple-650)',
        'transition',
        'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-3',
        'data-disabled:cursor-not-allowed data-disabled:opacity-40',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full',
          'bg-white dark:bg-gray-100',
          'bg-linear-to-b from-black/0 to-black/2',
          'ring-1 ring-(--color-umbra)/4 dark:ring-(--color-umbra)/12',
          'transition-all duration-120',
          'data-[state=checked]:translate-x-2 data-[state=unchecked]:translate-x-0',
          'relative size-3 shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_4px_4px_-2px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.06)]'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
