'use client';

import { DropDownChevron } from '@/ascendra-ui/components/common-ui/drop-down-chevron';
import { Button } from '@/ascendra-ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ascendra-ui/components/ui/dropdown-menu';
import { DropdownMenuSeparator } from '@/ascendra-ui/components/ui/dropdown-menu';
import { useDataTableColumns, useDataTableSort } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { cn } from '@/ascendra-ui/shadcn';
import { LuArrowDown, LuArrowUp, LuArrowUpDown } from 'react-icons/lu';

interface DataTableSortDropdownProps {
  icon?: boolean;
}

export function DataTableSortDropdown({
  icon = false,
}: DataTableSortDropdownProps) {
  const { columns } = useDataTableColumns();
  const { sortConfig, handleSort, clearSort } = useDataTableSort();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="group">
        <Button
          variant="secondary"
          size={icon ? 'icon' : 'default'}
          className={icon ? undefined : 'w-8 px-0 lg:w-auto lg:px-3'}
        >
          {icon ? (
            <LuArrowUpDown />
          ) : (
            <>
              <LuArrowUpDown className="lg:hidden" />
              <span className="hidden font-normal lg:inline">Sort by:</span>
              <span className={cn('hidden font-medium lg:inline')}>
                {sortConfig
                  ? (columns.find((c) => c.key === sortConfig.key)?.label ??
                    String(sortConfig.key))
                  : 'None'}
              </span>
              <DropDownChevron className="hidden lg:block" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={8}
        align="start"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuItem
          className={cn(!sortConfig && 'font-medium')}
          onClick={clearSort}
        >
          None
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {columns
          .filter((col) => col.sortable !== false)
          .map((col) => (
            <DropdownMenuItem
              key={String(col.key)}
              className={cn(sortConfig?.key === col.key && 'font-medium')}
              onClick={() => handleSort(col.key)}
            >
              {col.label}
              {sortConfig?.key === col.key &&
                (sortConfig.direction === 'asc' ? (
                  <LuArrowUp className="ml-auto size-3 shrink-0" />
                ) : (
                  <LuArrowDown className="ml-auto size-3 shrink-0" />
                ))}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
