import { Avatar, AvatarBadge, AvatarFallback, AvatarImage, cn } from '@/ascendra-ui/shadcn';
import { LucideChevronsUpDown } from 'lucide-react';

export function SideBarHeader({
  className,
  ...props
}: React.ComponentProps<'header'>) {
  return (
    <header data-slot="side-bar-header" className={cn('p-0.5 pr-1.5 pt-0', className)} {...props}>
      <button
        type="button"
        className="group bg-background focus-visible:outline-primary hover:bg-muted/75 flex w-full cursor-pointer items-center gap-2 rounded-[0.375rem] px-2 py-1.5 pt-0 text-left focus-visible:outline-2"
      >
        <Avatar>
          <AvatarImage
            src="https://github.com/shadcn.png"
            alt="@shadcn"
            className="rounded-sm"
          />
          <AvatarFallback>CN</AvatarFallback>
          <AvatarBadge className="bg-green-600 dark:bg-green-800" />
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-foreground truncate">User Management</span>
          <span className="text-muted-foreground truncate">Manage users</span>
        </div>
        <LucideChevronsUpDown className="text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform" />
      </button>
    </header>
  );
}
