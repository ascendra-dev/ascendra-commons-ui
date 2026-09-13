'use client';

import * as React from 'react';
import { cn } from '@/ascendra-ui/shadcn';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  full?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ full = false, className, type, onBlur, ...props }, ref) => {
    const [isPointer, setIsPointer] = React.useState(false);
    return (
      <div
        data-slot="input"
        className={cn(
          'dark:bg-secondary flex items-center rounded-[.375rem] bg-white transition overflow-hidden',
          // BASE
          'ring-1 ring-(--color-umbra)/12 dark:ring-(--color-gray-1000)/88 dark:ring-inset',
          // BASE SHADOW
          'shadow-[0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04)]',
          'dark:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24)]',
          // DISABLED (input inside is disabled)
          'has-[input:disabled]:cursor-not-allowed',
          'has-[input:disabled]:opacity-40',
          // READONLY
          'has-[input:read-only]:bg-gray-100 dark:has-[input:read-only]:bg-white/5',
          'has-[input:read-only]:ring-gray-300 dark:has-[input:read-only]:ring-white/10',
          'has-[input:read-only]:shadow-none',
          // HOVER (only when NOT readonly/disabled/focused)
          'has-[input:not(:read-only):not(:disabled):not(:focus)]:hover:ring-(--color-umbra)/24',
          'dark:has-[input:not(:read-only):not(:disabled):not(:focus)]:hover:ring-gray-950',
          'has-[input:not(:read-only):not(:disabled):not(:focus)]:hover:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.1),0_4px_4px_-2px_rgba(0,0,0,0.06)]',
          'dark:has-[input:not(:read-only):not(:disabled):not(:focus)]:hover:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.32),0_4px_4px_-2px_rgba(0,0,0,0.32)]',
          // INVALID
          'has-[input[aria-invalid=true]]:outline-2 has-[input[aria-invalid=true]]:outline-destructive has-[input[aria-invalid=true]]:outline-offset-1',
          // FOCUS
          isPointer &&
            'has-[input:focus:not(:read-only)]:shadow-[0_0_0_3px_rgba(0,0,0,0.08),0_4px_4px_-1px_rgba(0,0,0,0.08),0_4px_4px_-2px_rgba(0,0,0,0.04)] has-[input:focus:not(:read-only)]:ring-1 has-[input:focus:not(:read-only)]:ring-(--color-umbra)/12 dark:has-[input:focus:not(:read-only)]:shadow-[0_0_0_3px_rgba(61,61,74,0.4),0_4px_4px_-1px_rgba(0,0,0,0.08),0_4px_4px_-2px_rgba(0,0,0,0.16)] dark:has-[input:focus:not(:read-only)]:ring-black/88',
          // FOCUS VISIBLE (keyboard focus) — suppressed when field has an error
          !isPointer &&
            'has-[input:focus-visible:not(:active):not(:read-only)]:outline-primary! has-[input:focus-visible:not(:active):not(:read-only)]:outline-2! has-[input:focus-visible:not(:active):not(:read-only)]:outline-offset-1!',
          full ? 'w-full' : 'w-fit'
        )}
      >
        <input
          ref={ref}
          data-slot="input-control"
          type={type}
          onMouseDown={() => setIsPointer(true)}
          onBlur={(e) => {
            setIsPointer(false);
            onBlur?.(e);
          }}
          className={cn(
            'flex h-8 w-full bg-transparent px-3 py-1 text-sm',
            'outline-none placeholder:text-gray-500 dark:placeholder:text-gray-700',
            'disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
export { Input };
