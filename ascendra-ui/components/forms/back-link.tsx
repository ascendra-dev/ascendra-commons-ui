import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";
import { cn } from "@/ascendra-ui/shadcn";

export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "text-muted-foreground hover:text-foreground mb-8 flex w-fit items-center gap-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm font-medium",
        className,
      )}
    >
      <LuArrowLeft className="size-3 stroke-2" />
      {children}
    </Link>
  );
}
