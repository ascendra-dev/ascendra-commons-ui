import { Avatar, AvatarBadge, AvatarFallback, AvatarImage, cn } from '@/ascendra-ui/shadcn';
import { LucideChevronsUpDown, PlusIcon } from 'lucide-react';

export function SideBarFooter({
  className,
  ...props
}: React.ComponentProps<'footer'>) {
  return (
    <footer data-slot="side-bar-footer" className={cn('p-0.5 pr-1.5', className)} {...props}>
      <button
        type="button"
        className="group bg-background focus-visible:outline-primary hover:bg-muted/75 flex w-full cursor-pointer items-center gap-2 rounded-[0.375rem] px-2 py-1.5 text-left focus-visible:outline-2"
      >
        <Avatar className="grayscale">
          <AvatarImage
            src="https://github.com/pranathip.png"
            alt="@pranathip"
          />
          <AvatarFallback>PP</AvatarFallback>
          <AvatarBadge>
            <PlusIcon />
          </AvatarBadge>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-foreground truncate">User Management</span>
          <span className="text-muted-foreground truncate">Manage users</span>
        </div>
        <LucideChevronsUpDown className="text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform" />
      </button>
    </footer>
  );
}
