'use client';

import { TableFoot } from '@/ascendra-ui/components/ui/table';
import { useDataTableData } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { useOptionalQueryContext } from '@/ascendra-ui/providers/data-table-query/data-table-query.provider';

export function DataTableFoot() {
  const { pagination } = useDataTableData();
  const query = useOptionalQueryContext();

  const batch = query
    ? {
        currentBatch: query.currentBatch,
        totalBatches: query.totalBatches,
        goNextBatch: query.goNextBatch,
        goPrevBatch: query.goPrevBatch,
      }
    : undefined;

  return <TableFoot pagination={pagination} batch={batch} />;
}
