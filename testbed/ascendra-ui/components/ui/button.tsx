import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/ascendra-ui/shadcn';

const buttonVariants = cva(
  'gap-1.5 group relative inline-flex shrink-0 items-center focus-visible:outline-2 focus-visible:outline-offset-3 font-medium leading-[1.25rem] justify-center overflow-hidden transition-all duration-200 select-none disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer before:pointer-events-none before:absolute before:inset-0 before:size-full before:transition-opacity before:duration-200',
  {
    variants: {
      variant: {
        primary: [
          'focus-visible:outline-primary',
          'bg-primary text-white',
          /* The 4-Layer Shadow Stack */
          'shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(255,255,255,0.024),0_0_0_1px_rgb(108,71,255)]',
          'dark:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.16),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,0,0,0.12)]',
          /* Gloss Effect */
          'before:bg-linear-to-b before:from-white/20 before:to-transparent hover:before:opacity-0 dark:hover:bg-[var(--color-purple-600)]',
        ],
        secondary: [
          'focus-visible:outline-primary',
          'bg-secondary text-foreground',
          /* Secondary Shadow System */
          'shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.1)]',
          'dark:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.05),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,0,0,0.1)]',
          /* Subtle Dark Gradient Overlay */
          'before:bg-linear-to-b before:from-black/0 before:to-black/2 before:from-30% dark:before:to-black/12 hover:before:opacity-0 hover:bg-gray-50 dark:hover:bg-secondary',
        ],
        destructive: [
          'focus-visible:outline-[var(--color-red-700)]',
          'bg-[var(--color-red-700)] text-white',
          /* Clerk Destructive Shadow Stack */
          'shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-3px_rgba(0,0,0,0.24),0_0_0_1px_#f73d3d]',
          'dark:shadow-[inset_0_1px_0.5px_0_rgba(255,255,255,0.16),0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-3px_rgba(0,0,0,0.24),0_0_0_1px_rgba(0,0,0,0.12)]',
          /* Gloss Effect */
          'before:bg-linear-to-b before:from-white/20 before:to-transparent hover:before:opacity-0',
        ],
        ghost: [
          'focus-visible:outline-primary',
          'text-primary dark:text-[var(--color-purple-600)] dark:hover:text-primary bg-transparent shadow-none before:hidden',
          'hover:text-[var(--color-purple-800)]',
        ],
        link: [
          'focus-visible:outline-primary',
          'text-primary underline-offset-4 dark:text-[var(--color-purple-600)] hover:underline before:hidden',
          'shadow-none bg-transparent',
        ],
      },
      size: {
        xs: 'h-[20px] p-[8px]! text-2xs tracking-[0.015em] rounded-[4px]',
        sm: 'h-7 px-2.5 text-xs rounded-[0.3125rem]',
        default: 'h-8 px-3 text-sm rounded-[0.375rem]',
        lg: 'h-10 px-4 text-base rounded-[0.5rem]',
        icon: 'h-8 w-8 rounded-[0.375rem]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
