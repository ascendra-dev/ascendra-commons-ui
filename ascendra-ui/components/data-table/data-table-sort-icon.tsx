import { useDataTableColumns, useDataTableSort } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { LuArrowDown, LuArrowUp } from 'react-icons/lu';

interface DataTableSortIconProps {
  column: string;
}

export function DataTableSortIcon({ column }: DataTableSortIconProps) {
  const { isColSortable } = useDataTableColumns();
  const { sortConfig } = useDataTableSort();

  if (!isColSortable(column)) return null;

  const isActive = String(sortConfig?.key) === column;

  if (isActive && sortConfig!.direction === 'asc')
    return <LuArrowUp className="size-3 shrink-0" />;
  if (isActive && sortConfig!.direction === 'desc')
    return <LuArrowDown className="size-3 shrink-0" />;

  return (
    <LuArrowUp className="text-muted-foreground size-3 shrink-0 opacity-0 transition-opacity group-hover/sort:opacity-100" />
  );
}
