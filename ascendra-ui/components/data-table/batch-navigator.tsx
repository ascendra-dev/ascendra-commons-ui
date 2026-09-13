"use client";

import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useQueryContext } from "@/ascendra-ui/providers/data-table-query/data-table-query.provider";
import { PaginationButton } from "@/ascendra-ui/components/common-ui/pagination-button";

export function BatchNavigator() {
  const { currentBatch, totalBatches, goNextBatch, goPrevBatch } =
    useQueryContext();

  const atFirst = currentBatch === 1;
  const atLast = totalBatches !== null && currentBatch >= totalBatches;
  const label =
    totalBatches !== null
      ? `Batch ${currentBatch} of ${totalBatches}`
      : `Batch ${currentBatch}`;

  return (
    <div className="flex items-center justify-between gap-3 px-0.5 py-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-1.5">
        <PaginationButton
          disabled={atFirst}
          onClick={goPrevBatch}
          aria-label="Previous batch"
        >
          <LuChevronLeft className="size-3.5" />
        </PaginationButton>
        <PaginationButton
          disabled={atLast}
          onClick={goNextBatch}
          aria-label="Next batch"
        >
          <LuChevronRight className="size-3.5" />
        </PaginationButton>
      </div>
    </div>
  );
}
