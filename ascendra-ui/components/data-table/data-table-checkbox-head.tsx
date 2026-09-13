'use client';

import { Checkbox } from '@/ascendra-ui/components/ui/checkbox';
import { useDataTableSelection } from '@/ascendra-ui/providers/data-table/data-table.provider';

export function DataTableCheckboxHead() {
  const { isAllSelected, isIndeterminate, selectAll, clearPage, selectionEnabled } =
    useDataTableSelection();

  if (!selectionEnabled) return null;

  const checked = isAllSelected ? true : isIndeterminate ? 'indeterminate' : false;

  return (
    <th
      data-slot="table-head"
      className="py-3 pl-5 first:pl-6 w-10"
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => (isAllSelected || isIndeterminate ? clearPage() : selectAll())}
      />
    </th>
  );
}
