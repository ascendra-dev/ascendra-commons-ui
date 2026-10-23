"use client";

import { Suspense, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";
import { cn } from "@/ascendra-ui/shadcn";

/** The URL params a cross-link carries so the page it opens can go back to where you were. */
const BACK = "back";
const BACK_LABEL = "backLabel";

type BackLinkProps = {
  /** Where "back" goes by default — the page's parent. */
  href: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * The page's way back. By default its parent (`href`); opened from somewhere else by a link built with `useBackTo`,
 * it goes back there instead — "Back to denied requests", with that page's filters as they were.
 */
export function BackLink(props: BackLinkProps) {
  return (
    <Suspense fallback={<BackLinkView {...props} />}>
      <BackLinkFromUrl {...props} />
    </Suspense>
  );
}

function BackLinkFromUrl({ href, children, className }: BackLinkProps) {
  const params = useSearchParams();
  const back = samePath(params.get(BACK));
  const label = params.get(BACK_LABEL);
  return back ? (
    <BackLinkView href={back} className={className}>
      {label ? `Back to ${label}` : children}
    </BackLinkView>
  ) : (
    <BackLinkView href={href} className={className}>
      {children}
    </BackLinkView>
  );
}

function BackLinkView({ href, children, className }: BackLinkProps) {
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

/**
 * For a link that leaves this page for another section's page: `backTo(href)` adds this page's URL (with its query)
 * and `label` to `href`, so that page's BackLink returns here — "Back to {label}".
 */
export function useBackTo(label: string) {
  const pathname = usePathname();
  const params = useSearchParams();
  return useCallback(
    (href: string) => {
      const here = params.size ? `${pathname}?${params}` : pathname;
      const url = new URL(href, "http://local");
      url.searchParams.set(BACK, here);
      url.searchParams.set(BACK_LABEL, label);
      return `${url.pathname}${url.search}${url.hash}`;
    },
    [pathname, params, label],
  );
}

/** Only a path on this site — never another origin (`//host`, `/\host`, `https:`), so the param can't redirect away. */
function samePath(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : null;
}
