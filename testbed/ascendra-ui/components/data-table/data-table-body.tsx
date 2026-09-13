'use client';

import * as React from 'react';
import { TableBody } from '@/ascendra-ui/components/ui/table';
import { useDataTableData } from '@/ascendra-ui/providers/data-table/data-table.provider';
import type { BorderConfig, BgConfig } from '@/ascendra-ui/components/ui/accent-styles';

interface DataTableBodyProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: (item: any) => React.ReactNode;
  border?: BorderConfig;
  bg?: BgConfig;
}

export function DataTableBody({ children, border, bg }: DataTableBodyProps) {
  const { pagedData, isLoading } = useDataTableData();

  if (isLoading || pagedData.length === 0) return null;

  return (
    <TableBody border={border} bg={bg}>
      {pagedData.map((item) => children(item))}
    </TableBody>
  );
}
