'use client';

import { useEffect, useRef, useState } from 'react';
import { DropDownChevron } from '@/ascendra-ui/components/common-ui/drop-down-chevron';
import { Button } from '@/ascendra-ui/components/ui/button';
import { Checkbox } from '@/ascendra-ui/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/ascendra-ui/components/ui/dropdown-menu';
import { useDataTableColumns } from '@/ascendra-ui/providers/data-table/data-table.provider';
import { LuCheck, LuLock, LuSave, LuSettings } from 'react-icons/lu';
import { RiDraggable } from 'react-icons/ri';

interface DataTableColumnManagerProps {
  icon?: boolean;
}

export function DataTableColumnManager({ icon = false }: DataTableColumnManagerProps) {
  const { columns, toggleColumnActive, reorderColumns, saveColumnPreferences, isColumnPreferencesDirty } = useDataTableColumns();
  const dragKeyRef = useRef<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); }, []);

  function handleSave() {
    saveColumnPreferences?.();
    setJustSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setJustSaved(false), 1500);
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild className="group">
        <Button
          variant="secondary"
          size={icon ? 'icon' : 'default'}
          className={icon ? undefined : 'w-8 px-0 lg:w-auto lg:px-3'}
        >
          <LuSettings />
          {!icon && <span className="hidden lg:inline">Columns</span>}
          {!icon && <DropDownChevron className="hidden lg:block" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-54 px-0 py-1"
        sideOffset={8}
        align="start"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="text-muted-foreground px-3 py-1 text-xs">Manage columns</div>
        {columns.map((col) => {
          const canDrag = !col.freeze && col.active !== false;
          const canDropHere = !col.freeze;
          const isDropTarget = canDropHere && dragOverKey === String(col.key);
          return (
            <div
              key={String(col.key)}
              draggable={canDrag}
              onDragStart={(e) => {
                dragKeyRef.current = String(col.key);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                if (!canDropHere || !dragKeyRef.current) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverKey(String(col.key));
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragKeyRef.current && canDropHere) {
                  reorderColumns(dragKeyRef.current, String(col.key));
                }
                setDragOverKey(null);
              }}
              onDragEnd={() => {
                dragKeyRef.current = null;
                setDragOverKey(null);
              }}
              className={`animate-in fade-in flex items-center justify-between overflow-hidden px-3 py-1 duration-150 ${isDropTarget ? 'border-primary border-t-2' : ''}`}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  disabled={col.freeze}
                  checked={col.active !== false}
                  onCheckedChange={() => toggleColumnActive(String(col.key))}
                />
                <div className="mt-1">{col.label}</div>
              </div>
              {col.active !== false && col.freeze ? (
                <LuLock className="text-muted-foreground size-2.5 stroke-3" />
              ) : col.active !== false ? (
                <RiDraggable className="text-muted-foreground -mr-0.5 cursor-grab active:cursor-grabbing" />
              ) : null}
            </div>
          );
        })}
        {saveColumnPreferences && (
          <div className="border-t px-3 py-2">
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-1.5"
              disabled={!isColumnPreferencesDirty && !justSaved}
              onClick={handleSave}
            >
              {justSaved ? (
                <>
                  <LuCheck className="size-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <LuSave className="size-3.5" />
                  Save preferences
                </>
              )}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
