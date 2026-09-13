'use client';

import { useCallback, useMemo, useState } from 'react';

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  setPageSize: (size: number) => void;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
}

export function usePagination<T>(
  data: T[],
  defaultPageSize = 10,
): { pagination: PaginationState; paginatedData: T[] } {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);
  const [prevData, setPrevData] = useState(data);

  // React-recommended pattern for resetting state when a derived value changes:
  // calling setState during render triggers an immediate re-render and discards
  // the current one, avoiding the effect → setState cascade.
  // Track reference identity (not length) so same-count dataset swaps also reset.
  if (data !== prevData) {
    setPrevData(data);
    setCurrentPage(1);
  }

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedData = useMemo(
    () => data.slice(startIndex, endIndex),
    [data, startIndex, endIndex],
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const goFirst = useCallback(() => setCurrentPage(1), []);
  const goPrev = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(
    () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    [totalPages]
  );
  const goLast = useCallback(() => setCurrentPage(totalPages), [totalPages]);

  const pagination = useMemo<PaginationState>(
    () => ({
      currentPage: safeCurrentPage,
      totalPages,
      totalItems,
      pageSize,
      startIndex,
      endIndex,
      setPageSize,
      goFirst,
      goPrev,
      goNext,
      goLast,
    }),
    [safeCurrentPage, totalPages, totalItems, pageSize, startIndex, endIndex, setPageSize, goFirst, goPrev, goNext, goLast]
  );

  return { pagination, paginatedData };
}
