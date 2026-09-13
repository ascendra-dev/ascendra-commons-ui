'use client';

import { Button } from '@/ascendra-ui/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ascendra-ui/components/ui/dropdown-menu';
import { useDataTableColumns, useDataTableFilter } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { LuFilter } from 'react-icons/lu';

export function DataTableFilterDropdown() {
  const { filterableColumns } = useDataTableColumns();
  const { filters, addFilter } = useDataTableFilter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="group">
        <Button variant="secondary" size="icon">
          <LuFilter />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        sideOffset={8}
        className="w-44"
        align="start"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {filterableColumns.map((col) => {
          const active = filters.some((f) => f.key === String(col.key));
          return (
            <DropdownMenuItem
              key={String(col.key)}
              disabled={active}
              onClick={() => addFilter(String(col.key))}
            >
              {col.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
