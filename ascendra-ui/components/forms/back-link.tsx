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
  /** The page's parent. */
  href: string;
  /** What the link says: "Back to people". */
  children: React.ReactNode;
  /** The parent's name ("People") — shown instead, without the arrow, while the page title has a back icon (the
   *  page was opened by a cross-link): one arrow on screen, for where the user came from; this link reads as where
   *  the page sits. */
  label?: string;
  className?: string;
};

/**
 * The page's way up — to its parent (`href`), always. Opened from another section by a link built with `useBackTo`,
 * the page title shows a back icon to where the user came from, and this link becomes the parent's name.
 */
export function BackLink(props: BackLinkProps) {
  return (
    <Suspense fallback={<BackLinkView {...props} />}>
      <BackLinkFromUrl {...props} />
    </Suspense>
  );
}

function BackLinkFromUrl(props: BackLinkProps) {
  const crossLinked = samePath(useSearchParams().get(BACK)) !== null;
  return <BackLinkView {...props} asLocation={crossLinked && props.label !== undefined} />;
}

function BackLinkView({ href, children, label, className, asLocation = false }: BackLinkProps & { asLocation?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "text-muted-foreground hover:text-foreground mb-8 flex w-fit items-center gap-1.5 text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm font-medium",
        className,
      )}
    >
      {asLocation ? (
        label
      ) : (
        <>
          <LuArrowLeft className="size-3 stroke-2" />
          {children}
        </>
      )}
    </Link>
  );
}

/**
 * A back arrow beside the page title — only when the page was opened by a cross-link built with `useBackTo`; it
 * returns there (labelled "Back to denied requests" for screen readers), with that page's filters as they were. Nothing otherwise. PageTitle
 * renders it.
 */
export function PageBackButton() {
  return (
    <Suspense fallback={null}>
      <PageBackButtonFromUrl />
    </Suspense>
  );
}

function PageBackButtonFromUrl() {
  const params = useSearchParams();
  const back = samePath(params.get(BACK));
  if (!back) return null;
  const label = `Back to ${params.get(BACK_LABEL) || "the previous page"}`;
  return (
    <Link
      href={back}
      aria-label={label}
      data-slot="page-back-button"
      className="text-muted-foreground bg-foreground/6 focus-visible:ring-primary mr-2 flex size-7 shrink-0 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2"
    >
      <LuArrowLeft className="size-4 stroke-2" />
    </Link>
  );
}

/**
 * For a link that leaves this page for another section's page: `backTo(href)` adds this page's URL (with its query)
 * and `label` to `href`, so that page shows a back icon beside its title that returns here — "Back to {label}".
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
