'use client';

import { Button } from '@/ascendra-ui/components/ui/button';
import {
  downloadCsv,
  type DownloadCsvOptions,
} from '@/ascendra-ui/utils/common.util';
import { LuDownload } from 'react-icons/lu';

export interface ExportCsvButtonProps<T extends object>
  extends DownloadCsvOptions<T>,
    Omit<React.ComponentProps<typeof Button>, 'onClick' | 'children'> {
  /** Rows to export as CSV. */
  data: T[];
  /** Button label. Ignored (used as the accessible name instead) when iconOnly is true. Default "Export CSV". */
  title?: string;
  /** Show only the icon, no visible label. */
  iconOnly?: boolean;
  icon?: React.ReactNode;
}

/**
 * Drop-in button that calls `downloadCsv` on click. For a fully custom
 * trigger, skip this component and call `downloadCsv`/`objectsToCsv`
 * (from `@/ascendra-ui/utils/common.util`) directly instead.
 */
export function ExportCsvButton<T extends object>({
  data,
  exclude,
  filename,
  title = 'Export CSV',
  iconOnly = false,
  icon = <LuDownload className="size-3.5" />,
  variant = 'secondary',
  ...props
}: ExportCsvButtonProps<T>) {
  return (
    <Button
      variant={variant}
      onClick={() => downloadCsv(data, { exclude, filename })}
      aria-label={iconOnly ? title : undefined}
      {...props}
    >
      {icon}
      {!iconOnly && title}
    </Button>
  );
}
