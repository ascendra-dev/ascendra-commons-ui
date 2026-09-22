import Link from "next/link";
import { Button, PageHeader, PageHeaderGroup, PageMain, PageSubtitle, PageTitle } from "@/ascendra-ui";

/**
 * The vertical's own app — everything below `/observability` belongs to the
 * shell (`app/observability/`, copied verbatim from `packages/observability`)
 * and is never hand-touched here. This is the one link into it.
 */
export default function HomePage() {
  return (
    <>
      <PageHeader>
        <PageHeaderGroup>
          <PageTitle>Ascendra Commons UI — Testbed</PageTitle>
          <PageSubtitle>A stand-in vertical app, proving the copy-once observability shell.</PageSubtitle>
        </PageHeaderGroup>
      </PageHeader>
      <PageMain>
        <Button asChild>
          <Link href="/observability">Open Observability</Link>
        </Button>
      </PageMain>
    </>
  );
}
