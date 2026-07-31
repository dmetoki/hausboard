"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { parseDate } from "@/lib/utils";

export type OrgFilterOption = {
  label: string;
  value: string;
};

export type OrgFilterConfig = {
  id: string;
  options: OrgFilterOption[];
};

export type OrgSettingsEntry = {
  id: string;
  filters: OrgFilterConfig[];
};

export type AppSettings = {
  locale?: string;
  min_date?: string;
  max_date?: string;
  theme?: string;
  orgs?: OrgSettingsEntry[];
};

type SettingsContextValue = {
  customLocale: string;
  setCustomLocale: (locale: string) => void;
  customTheme: string;
  setCustomTheme: (theme: string) => void;
  minDate: Date;
  maxDate: Date;
  orgs: OrgSettingsEntry[] | undefined;
};

const DEFAULT_WINDOW_DAYS = 30;

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function SettingsProvider({
  children,
  settings,
}: {
  children: ReactNode;
  settings: AppSettings | null;
}) {
  const [customLocale, setCustomLocale] = useState(
    settings?.locale ?? "en-US",
  );
  const [customTheme, setCustomTheme] = useState(settings?.theme ?? "system");

  const minDateInput = settings?.min_date;
  const maxDateInput = settings?.max_date;

  const { minDate, maxDate } = useMemo(() => {
    const fallbackMax = new Date();
    const fallbackMin = new Date(fallbackMax);
    fallbackMin.setDate(fallbackMax.getDate() - DEFAULT_WINDOW_DAYS);

    const parsedMin = minDateInput ? parseDate(minDateInput) : undefined;
    const parsedMax = maxDateInput ? parseDate(maxDateInput) : undefined;

    return {
      minDate: parsedMin && isValidDate(parsedMin) ? parsedMin : fallbackMin,
      maxDate: parsedMax && isValidDate(parsedMax) ? parsedMax : fallbackMax,
    };
  }, [minDateInput, maxDateInput]);

  const value = useMemo(
    () => ({
      customLocale,
      setCustomLocale,
      customTheme,
      setCustomTheme,
      minDate,
      maxDate,
      orgs: settings?.orgs,
    }),
    [customLocale, customTheme, minDate, maxDate, settings?.orgs],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useAppSettings must be used within a SettingsProvider");
  return ctx;
}
