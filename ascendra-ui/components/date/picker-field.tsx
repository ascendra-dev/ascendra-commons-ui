'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { LuCalendar, LuPencil } from 'react-icons/lu';
import { cn } from '@/ascendra-ui/shadcn';
import { clearOnKey, PickerClearButton } from '@/ascendra-ui/components/date/picker-clear-button';

/** The field look shared by both pickers' triggers — the button form and the editable form. */
export function pickerFieldClass({
  invalid,
  readOnly,
  empty,
  editable,
  disabled,
}: {
  invalid?: boolean;
  readOnly?: boolean;
  empty?: boolean;
  editable?: boolean;
  disabled?: boolean;
}) {
  const focus = editable
    ? 'has-focus-visible:outline-primary! has-focus-visible:outline-2! has-focus-visible:outline-offset-1!'
    : 'focus-visible:outline-primary! focus-visible:outline-2! focus-visible:outline-offset-1!';
  return cn(
    'flex h-8 w-full items-center gap-2 rounded-[.375rem] px-3 text-left text-sm transition',
    'ring-1',
    'shadow-[0_2px_2px_-1px_rgba(0,0,0,0.06),0_4px_4px_-2px_rgba(0,0,0,0.04)]',
    'dark:shadow-[0_2px_2px_-1px_rgba(0,0,0,0.16),0_4px_4px_-2px_rgba(0,0,0,0.24)]',
    'disabled:cursor-not-allowed disabled:opacity-40',
    disabled && 'cursor-not-allowed opacity-40',
    invalid && 'outline-2 outline-destructive outline-offset-1',
    empty && !editable && 'text-gray-500 dark:text-gray-700',
    readOnly
      ? ['bg-gray-100 dark:bg-white/5', 'ring-gray-300 dark:ring-white/10', 'shadow-none', 'cursor-default', 'focus-visible:outline-none']
      : [
          'bg-white dark:bg-secondary',
          'ring-(--color-umbra)/12 dark:ring-(--color-gray-1000)/88 dark:ring-inset',
          'hover:ring-(--color-umbra)/24',
          focus,
        ]
  );
}

interface EditableDateFieldProps {
  id?: string;
  /** The value in the friendly display format — what the field shows outside edit mode. */
  label: string | null;
  /** Shown in display mode when there's no value. */
  placeholder: string;
  /** The value as typeable text (dateFormat) — what edit mode starts from. */
  committedText: string;
  /** Edit mode's placeholder, e.g. `dd/mm/yyyy`. */
  editPlaceholder: string;
  /**
   * Typed text on blur/Enter. Rejecting it is just not changing the value — edit mode ends either
   * way, so the field shows the last valid value again.
   */
  onCommitText: (text: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  className?: string;
  clearVisible: boolean;
  onClear: () => void;
  slot: string;
  /** Accessible name of the pencil button, e.g. "Type date". */
  editLabel: string;
}

/**
 * The `editable` form of a date picker trigger. Display mode looks and behaves like the plain
 * picker (calendar icon, friendly format, click opens the calendar) plus a pencil button; the pencil
 * — or typing a digit on the focused field — switches to edit mode, a text input in dateFormat.
 * Blur/Enter reads it and returns to display mode; Escape cancels. Must render inside the picker's
 * Popover Root — the wrapper is the popover's anchor.
 */
export function EditableDateField({
  id,
  label,
  placeholder,
  committedText,
  editPlaceholder,
  onCommitText,
  onBlur,
  disabled,
  readOnly,
  invalid,
  className,
  clearVisible,
  onClear,
  slot,
  editLabel,
}: EditableDateFieldProps) {
  // null = display mode; a string = edit mode holding the text being typed.
  const [draft, setDraft] = React.useState<string | null>(null);
  const selectOnFocus = React.useRef(false);
  const editing = draft !== null;

  const startEditing = (initial: string, selectAll: boolean) => {
    selectOnFocus.current = selectAll;
    setDraft(initial);
  };

  const finish = (commit: boolean) => {
    if (commit && draft !== null && draft !== committedText) onCommitText(draft);
    setDraft(null);
  };

  return (
    <PopoverPrimitive.Anchor asChild>
      <div
        data-slot={slot}
        data-editable=""
        data-editing={editing || undefined}
        aria-invalid={invalid || undefined}
        className={cn(
          pickerFieldClass({ invalid, readOnly, empty: !label, editable: true, disabled }),
          'pr-1.5',
          className
        )}
      >
        <LuCalendar className="text-muted-foreground size-4 shrink-0" />
        {editing ? (
          <input
            id={id}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={draft}
            placeholder={editPlaceholder}
            aria-invalid={invalid || undefined}
            onFocus={(e) => {
              if (selectOnFocus.current) e.currentTarget.select();
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              finish(true);
              onBlur?.();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                finish(true);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                finish(false);
              }
            }}
            className="placeholder:text-gray-500 dark:placeholder:text-gray-700 min-w-0 flex-1 bg-transparent outline-none"
          />
        ) : (
          <>
            <PopoverPrimitive.Trigger asChild>
              <button
                id={id}
                type="button"
                disabled={disabled}
                onKeyDown={(e) => {
                  // A digit typed on the focused field starts edit mode with it.
                  if (!readOnly && /^\d$/.test(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    startEditing(e.key, false);
                    return;
                  }
                  clearOnKey(clearVisible, onClear)(e);
                }}
                className={cn(
                  'flex h-full min-w-0 flex-1 items-center text-left outline-none disabled:cursor-not-allowed',
                  !label && 'text-gray-500 dark:text-gray-700'
                )}
              >
                <span className="min-w-0 truncate">{label ?? placeholder}</span>
              </button>
            </PopoverPrimitive.Trigger>
            {!readOnly && (
              <button
                type="button"
                aria-label={editLabel}
                disabled={disabled}
                onClick={() => startEditing(committedText, true)}
                className="text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 flex shrink-0 items-center justify-center rounded-sm p-0.5 outline-none disabled:pointer-events-none"
              >
                <LuPencil className="size-3.5" />
              </button>
            )}
            {clearVisible && <PickerClearButton onClear={onClear} className="ml-0" />}
          </>
        )}
      </div>
    </PopoverPrimitive.Anchor>
  );
}
