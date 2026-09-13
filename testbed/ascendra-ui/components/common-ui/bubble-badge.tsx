import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/ascendra-ui/shadcn';

const bubbleBadgeVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-all select-none leading-none',
  {
    variants: {
      size: {
        sm: 'h-[18px] min-w-[18px] px-[3px] text-[10px]',
        md: 'h-5 min-w-5 px-1 text-2xs',
        lg: 'h-6 min-w-6 px-1.5 text-xs',
      },
      color: {
        gray:   'bg-gradient-to-b from-gray-100 to-gray-200 text-gray-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_1px_2px_rgba(0,0,0,0.08)]',
        blue:   'bg-gradient-to-b from-blue-400 to-blue-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
        green:  'bg-gradient-to-b from-green-400 to-green-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
        red:    'bg-gradient-to-b from-red-400 to-red-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
        amber:  'bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
        orange: 'bg-gradient-to-b from-orange-400 to-orange-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
        violet:   'bg-gradient-to-b from-violet-400 to-violet-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
        warning:  'bg-gradient-to-b from-warning/80 to-warning text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
        positive: 'bg-gradient-to-b from-positive/80 to-positive text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
        info:     'bg-gradient-to-b from-info/80 to-info text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.15)]',
      },
    },
    defaultVariants: { size: 'sm', color: 'gray' },
  }
);

export function BubbleBadge({
  size,
  color,
  className,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof bubbleBadgeVariants>) {
  return (
    <span
      data-slot="bubble-badge"
      className={cn(bubbleBadgeVariants({ size, color }), className)}
      {...props}
    >
      {children}
    </span>
  );
}
