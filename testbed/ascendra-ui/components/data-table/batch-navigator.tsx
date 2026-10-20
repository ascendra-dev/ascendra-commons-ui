"use client";

import { LuChevronLeft, LuChevronRight, LuLoaderCircle } from "react-icons/lu";
import { useQueryContext } from "@/ascendra-ui/providers/data-table-query/data-table-query.provider";
import { PaginationButton } from "@/ascendra-ui/components/common-ui/pagination-button";

export function BatchNavigator() {
  const { currentBatch, totalBatches, totalBatchesExact, batchLoading, goNextBatch, goPrevBatch } =
    useQueryContext();

  const atFirst = currentBatch === 1 || !!batchLoading;
  const atLast = (totalBatches !== null && currentBatch >= totalBatches) || !!batchLoading;
  const label =
    totalBatches !== null && totalBatchesExact
      ? `Batch ${currentBatch} of ${totalBatches}`
      : `Batch ${currentBatch}`;
  const spinner = <LuLoaderCircle className="size-3.5 animate-spin" />;
  const prevIcon = batchLoading === "prev" ? spinner : <LuChevronLeft className="size-3.5" />;
  const nextIcon = batchLoading === "next" ? spinner : <LuChevronRight className="size-3.5" />;

  return (
    <div className="flex items-center justify-between gap-3 px-0.5 py-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-1.5">
        <PaginationButton
          disabled={atFirst}
          onClick={goPrevBatch}
          aria-label="Previous batch"
          aria-busy={batchLoading === "prev"}
        >
          {prevIcon}
        </PaginationButton>
        <PaginationButton
          disabled={atLast}
          onClick={goNextBatch}
          aria-label="Next batch"
          aria-busy={batchLoading === "next"}
        >
          {nextIcon}
        </PaginationButton>
      </div>
    </div>
  );
}
