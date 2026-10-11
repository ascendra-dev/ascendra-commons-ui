'use client';

import { useState } from 'react';
import { LuDownload, LuLoader } from 'react-icons/lu';
import { toast } from '@/ascendra-ui/components/common-ui/toast';
import { Button } from '@/ascendra-ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ascendra-ui/components/ui/dialog';
import type { ExportResult } from '@/ascendra-ui/lib/api/types';
import { useQueryContext } from '@/ascendra-ui/providers/data-table-query/data-table-query.provider';
import type { QueryParamValues } from '@/ascendra-ui/providers/data-table-query/data-table-query.types';
import { downloadBlob, timestampFilename } from '@/ascendra-ui/utils/common.util';

export interface DataTableExportButtonProps
  extends Omit<React.ComponentProps<typeof Button>, 'onClick' | 'children' | 'title'> {
  /** Fetches the full export for the table's confirmed query — not just the loaded batch. See `fetchExport`. */
  exportFn: (params: QueryParamValues, queryId: string) => Promise<ExportResult>;
  /** Button label, and the confirmation dialog's title. Ignored (used as the accessible name instead) when iconOnly is true. */
  title?: string;
  /** Used when the response names no file. A timestamp is always inserted before the extension. */
  filename?: string;
  iconOnly?: boolean;
  icon?: React.ReactNode;
}

const spinner = <LuLoader className="size-3.5 animate-spin" />;

export function DataTableExportButton({
  exportFn,
  title = 'Export CSV',
  filename = 'export.csv',
  iconOnly = false,
  icon = <LuDownload className="size-3.5" />,
  variant = 'secondary',
  disabled,
  ...props
}: DataTableExportButtonProps) {
  const { confirmedParams, confirmedQueryId, pendingQueryId, data, isInitializing, isLoading, isError } =
    useQueryContext();
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const noResult = isInitializing || isLoading || isError || pendingQueryId !== null || data.length === 0;
  const buttonIcon = exporting ? spinner : icon;

  async function runExport() {
    setExporting(true);
    try {
      const result = await exportFn(confirmedParams ?? {}, confirmedQueryId);
      downloadBlob(result.blob, result.filename ?? timestampFilename(filename));
      toastResult(result);
      setOpen(false);
    } catch (err) {
      toast.error('Export failed', { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <Button
        data-slot="data-table-export-button"
        variant={variant}
        disabled={disabled || noResult || exporting}
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? title : undefined}
        {...props}
      >
        {buttonIcon}
        {!iconOnly && title}
      </Button>
      <Dialog open={open} onOpenChange={(next) => !exporting && setOpen(next)}>
        <DialogContent data-slot="data-table-export-dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Exports every record matching the current query, not just the rows loaded in the table. Search and
              column filters applied in the table are not included.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="secondary" disabled={exporting} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={exporting} onClick={() => void runExport()}>
              {buttonIcon}
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function toastResult({ rowCount, truncated, limit }: ExportResult) {
  if (truncated) {
    toast.warning(`Exported the first ${records(limit ?? rowCount ?? 0)}`, {
      description: 'More records match this query than the export limit allows. Narrow the filter to export the rest.',
    });
    return;
  }
  toast.success(rowCount === undefined ? 'Export complete' : `Exported ${records(rowCount)}`);
}

function records(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? 'record' : 'records'}`;
}
