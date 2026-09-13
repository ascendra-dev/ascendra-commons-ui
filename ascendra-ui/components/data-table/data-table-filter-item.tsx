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
    <div className="bg-muted flex items-center rounded-full border border-dashed border-gray-700/30 py-0.75 text-xs">
      <div
        className="flex cursor-pointer items-center gap-1 px-1.5"
        onClick={() => onRemove(columnKey)}
      >
        <RxCrossCircled />
        {label}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex cursor-pointer items-center gap-1 border-l px-1.5">
            <span className={cn(!value && 'text-muted-foreground')}>
              {value ?? 'Enter Value'}
            </span>
            <DropDownChevron />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent sideOffset={8} align="start">
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
    </div>
  );
}
