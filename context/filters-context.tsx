"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export type DateRangeFilter = {
  from?: string;
  to?: string;
};

type FiltersContextValue = {
  filters: DateRangeFilter | undefined;
  setFilters: Dispatch<SetStateAction<DateRangeFilter | undefined>>;
  resetFilters: () => void;
};

const FiltersContext = createContext<FiltersContextValue | undefined>(
  undefined,
);

export function FiltersProvider({
  children,
  initialFilters,
}: {
  children: ReactNode;
  initialFilters?: DateRangeFilter;
}) {
  const [filters, setFilters] = useState<DateRangeFilter | undefined>(
    initialFilters,
  );
  const resetFilters = useCallback(() => setFilters(undefined), []);

  const value = useMemo(
    () => ({ filters, setFilters, resetFilters }),
    [filters, resetFilters],
  );

  return (
    <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used within a FiltersProvider");
  return ctx;
}
