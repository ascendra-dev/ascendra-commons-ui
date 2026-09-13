import { cn } from '@/ascendra-ui/shadcn';
import { cva, VariantProps } from 'class-variance-authority';
import { LuChevronDown } from 'react-icons/lu';

const variants = cva(
  'font-bold transition-transform duration-300 group-data-[state=open]:rotate-180',
  {
    variants: {
      variant: {
        default: 'text-muted-foreground',
        primary: 'text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function DropDownChevron({
  variant,
  className,
  ...props
}: React.ComponentProps<typeof LuChevronDown> & VariantProps<typeof variants>) {
  return <LuChevronDown className={cn(variants({ variant }), className)} {...props}/>;
}
