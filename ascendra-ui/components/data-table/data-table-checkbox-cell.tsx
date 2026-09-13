'use client';

import { Checkbox } from '@/ascendra-ui/components/ui/checkbox';
import { useDataTableSelection } from '@/ascendra-ui/providers/data-table/data-table.provider';

interface DataTableCheckboxCellProps {
  rowId: string;
}

export function DataTableCheckboxCell({ rowId }: DataTableCheckboxCellProps) {
  const { isRowSelected, toggleRow, selectionEnabled } = useDataTableSelection();

  if (!selectionEnabled) return null;

  return (
    <td
      data-slot="table-cell"
      className="py-4 pl-5 first:pl-6 w-10"
    >
      <Checkbox
        checked={isRowSelected(rowId)}
        onCheckedChange={() => toggleRow(rowId)}
      />
    </td>
  );
}
