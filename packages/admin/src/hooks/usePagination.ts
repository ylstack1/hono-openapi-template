import { useState } from "react";

import type { PaginationParams } from "../lib/types";

import { DEFAULT_PAGE_SIZE } from "../lib/constants";

export function usePagination(
  initialPage = 1,
  initialPageSize = DEFAULT_PAGE_SIZE,
) {
  const [params, setParams] = useState<PaginationParams>({
    page: initialPage,
    pageSize: initialPageSize,
  });

  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const setPageSize = (pageSize: number) => {
    setParams({ page: 1, pageSize });
  };

  const nextPage = () => {
    setParams((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  const prevPage = () => {
    setParams((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
  };

  const reset = () => {
    setParams({ page: initialPage, pageSize: initialPageSize });
  };

  return {
    ...params,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    reset,
  };
}
