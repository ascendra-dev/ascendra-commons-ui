'use client';

import { DropDownChevron } from '@/ascendra-ui/components/common-ui/drop-down-chevron';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ascendra-ui/components/ui/dropdown-menu';
import { cn } from '@/ascendra-ui/shadcn';
import { RxCrossCircled } from 'react-icons/rx';
import { FilterChip, FilterChipValue } from './filter-chip';

interface DataTableFilterItemProps {
  columnKey: string;
  label: string;
  options: string[];
  value: string | null;
  onChange: (key: string, value: string) => void;
  onRemove: (key: string) => void;
}

export function DataTableFilterItem({
  columnKey,
  label,
  options,
  value,
  onChange,
  onRemove,
}: DataTableFilterItemProps) {
  return (
    <FilterChip
      label={label}
      action={{
        icon: <RxCrossCircled />,
        'aria-label': `Remove ${label} filter`,
        onClick: () => onRemove(columnKey),
      }}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <FilterChipValue className="cursor-pointer">
            <span className={cn(!value && 'text-muted-foreground')}>
              {value ?? 'Enter Value'}
            </span>
            <DropDownChevron />
          </FilterChipValue>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          sideOffset={8}
          align="start"
          className="w-auto min-w-48 max-w-xs"
        >
          {options.length === 0 ? (
            <DropdownMenuItem disabled>No values</DropdownMenuItem>
          ) : (
            options.map((opt) => (
              <DropdownMenuItem
                key={opt}
                className={cn(value === opt && 'font-medium')}
                onClick={() => onChange(columnKey, opt)}
              >
                {opt}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </FilterChip>
  );
}
