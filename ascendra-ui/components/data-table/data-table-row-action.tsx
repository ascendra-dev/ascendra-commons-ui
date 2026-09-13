'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ascendra-ui/components/ui/dropdown-menu';
import { RowActionButton } from '@/ascendra-ui/components/common-ui/row-action-button';
import { LuCopy, LuEye, LuPencil, LuTrash2 } from 'react-icons/lu';

interface RowActionContextValue {
  onAction?: (actionId: string) => void;
}
const RowActionContext = React.createContext<RowActionContextValue>({});

export type RowActionVariant = 'ghost' | 'visible';
export type RowActionItemVariant = 'default' | 'destructive';

// ─── Container ────────────────────────────────────────────────────────────────

interface DataTableRowActionProps {
  children?: React.ReactNode;
  /** Controls trigger button visibility. 'ghost' hides until hover; 'visible' always shows. */
  variant?: RowActionVariant;
  /** Called with the action id when a menu item is selected. */
  onAction?: (actionId: string) => void;
}

export function DataTableRowAction({
  children,
  variant = 'ghost',
  onAction,
}: DataTableRowActionProps) {
  return (
    <RowActionContext.Provider value={{ onAction }}>
      <td data-slot="table-cell" className="px-5 py-4 last:pr-6 w-12">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <RowActionButton opaque={variant === 'visible'} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="w-56"
              align="end"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              {children}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </RowActionContext.Provider>
  );
}

/** Marker consumed by orderChildrenByColumn to place this column last. */
DataTableRowAction.isLastColumn = true as const;

// ─── Item ─────────────────────────────────────────────────────────────────────

export interface DataTableRowActionItemProps {
  /** Passed to onAction when selected. */
  id: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: RowActionItemVariant;
  disabled?: boolean;
}

export function DataTableRowActionItem({
  id,
  icon,
  children,
  variant,
  disabled,
}: DataTableRowActionItemProps) {
  const { onAction } = React.useContext(RowActionContext);
  return (
    <DropdownMenuItem
      variant={variant === 'destructive' ? 'destructive' : 'default'}
      disabled={disabled}
      onSelect={() => onAction?.(id)}
    >
      {icon}
      {children}
    </DropdownMenuItem>
  );
}

// ─── Standard presets ─────────────────────────────────────────────────────────

export function DataTableViewRowAction(
  props: Partial<DataTableRowActionItemProps>,
) {
  return (
    <DataTableRowActionItem id="view" icon={<LuEye />} {...props}>
      {props.children ?? 'View details'}
    </DataTableRowActionItem>
  );
}

export function DataTableEditRowAction(
  props: Partial<DataTableRowActionItemProps>,
) {
  return (
    <DataTableRowActionItem id="edit" icon={<LuPencil />} {...props}>
      {props.children ?? 'Edit'}
    </DataTableRowActionItem>
  );
}

export function DataTableDuplicateRowAction(
  props: Partial<DataTableRowActionItemProps>,
) {
  return (
    <DataTableRowActionItem id="duplicate" icon={<LuCopy />} {...props}>
      {props.children ?? 'Duplicate'}
    </DataTableRowActionItem>
  );
}

export function DataTableDeleteRowAction(
  props: Partial<DataTableRowActionItemProps>,
) {
  return (
    <DataTableRowActionItem id="delete" icon={<LuTrash2 />} variant="destructive" {...props}>
      {props.children ?? 'Delete'}
    </DataTableRowActionItem>
  );
}
