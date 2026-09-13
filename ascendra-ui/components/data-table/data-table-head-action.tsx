"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ascendra-ui/components/ui/dropdown-menu";
import { RowActionButton } from "@/ascendra-ui/components/common-ui/row-action-button";
import { useDataTableSelection } from "@/ascendra-ui/providers/data-table/data-table.provider";
import { LuDownload, LuRefreshCw, LuSettings2, LuSquareCheck, LuSquareMinus, LuTrash2 } from "react-icons/lu";

export type HeadActionVariant = "ghost" | "visible";
export type HeadActionItemVariant = "default" | "destructive";

interface HeadActionContextValue {
  onAction?: (actionId: string, selectedRowIds: string[]) => void;
  selectedRowIds: string[];
}
const HeadActionContext = React.createContext<HeadActionContextValue>({
  selectedRowIds: [],
});

// ─── Container ────────────────────────────────────────────────────────────────

interface DataTableHeadActionProps {
  children?: React.ReactNode;
  /** Controls trigger button visibility. 'ghost' hides until hover; 'visible' always shows. */
  variant?: HeadActionVariant;
  /** Called with the action id and the currently selected row ids when a menu item is selected. */
  onAction?: (actionId: string, selectedRowIds: string[]) => void;
}

export function DataTableHeadAction({
  children,
  variant = "ghost",
  onAction,
}: DataTableHeadActionProps) {
  const { selectedRows, selectionEnabled, isAllDataSelected, selectAllData, clearSelection } = useDataTableSelection();
  const selectedRowIds = selectionEnabled ? [...selectedRows] : [];
  const selectionCount = selectionEnabled ? selectedRows.size : 0;
  const hasChildren = React.Children.count(children) > 0;

  return (
    <HeadActionContext.Provider value={{ onAction, selectedRowIds }}>
      <th data-slot="table-head" className="py-3 pr-6 pl-5 w-12">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <RowActionButton opaque={variant === "visible"} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="w-56"
              align="end"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel>
                {selectionCount} {selectionCount === 1 ? "row" : "rows"}{" "}
                selected
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {selectionEnabled && (
                <>
                  <DropdownMenuItem
                    disabled={isAllDataSelected}
                    onSelect={selectAllData}
                  >
                    <LuSquareCheck />
                    Select all
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={selectionCount === 0}
                    onSelect={clearSelection}
                  >
                    <LuSquareMinus />
                    Clear all
                  </DropdownMenuItem>
                  {hasChildren && <DropdownMenuSeparator />}
                </>
              )}
              {children}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </th>
    </HeadActionContext.Provider>
  );
}

/** Marker consumed by orderChildrenByColumn to place this column last. */
DataTableHeadAction.isLastColumn = true as const;

// ─── Item ─────────────────────────────────────────────────────────────────────

export interface DataTableHeadActionItemProps {
  /** Passed to onAction when selected. */
  id: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: HeadActionItemVariant;
  disabled?: boolean;
  /** When true, the item is not auto-disabled when no rows are selected. */
  selectionIndependent?: boolean;
}

export function DataTableHeadActionItem({
  id,
  icon,
  children,
  variant,
  disabled,
  selectionIndependent = false,
}: DataTableHeadActionItemProps) {
  const { onAction, selectedRowIds } = React.useContext(HeadActionContext);
  const noSelection = selectedRowIds.length === 0;
  return (
    <DropdownMenuItem
      variant={variant === "destructive" ? "destructive" : "default"}
      disabled={disabled ?? (!selectionIndependent && noSelection)}
      onSelect={() => onAction?.(id, selectedRowIds)}
    >
      {icon}
      {children}
    </DropdownMenuItem>
  );
}

// ─── Standard presets ─────────────────────────────────────────────────────────

export function DataTableExportHeadAction(
  props: Partial<DataTableHeadActionItemProps>,
) {
  return (
    <DataTableHeadActionItem id="export" icon={<LuDownload />} {...props}>
      {props.children ?? "Export"}
    </DataTableHeadActionItem>
  );
}

export function DataTableRefreshHeadAction(
  props: Partial<DataTableHeadActionItemProps>,
) {
  return (
    <DataTableHeadActionItem id="refresh" icon={<LuRefreshCw />} {...props}>
      {props.children ?? "Refresh"}
    </DataTableHeadActionItem>
  );
}

export function DataTableManageColumnsHeadAction(
  props: Partial<DataTableHeadActionItemProps>,
) {
  return (
    <DataTableHeadActionItem
      id="manage-columns"
      icon={<LuSettings2 />}
      {...props}
    >
      {props.children ?? "Manage columns"}
    </DataTableHeadActionItem>
  );
}

export function DataTableBulkExportHeadAction(
  props: Partial<DataTableHeadActionItemProps>,
) {
  return (
    <DataTableHeadActionItem id="bulk-export" icon={<LuDownload />} {...props}>
      {props.children ?? "Export selected rows"}
    </DataTableHeadActionItem>
  );
}

export function DataTableBulkDeleteHeadAction(
  props: Partial<DataTableHeadActionItemProps>,
) {
  return (
    <DataTableHeadActionItem
      id="bulk-delete"
      icon={<LuTrash2 />}
      variant="destructive"
      {...props}
    >
      {props.children ?? "Delete selected rows"}
    </DataTableHeadActionItem>
  );
}
