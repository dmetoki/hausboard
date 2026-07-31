"use client";

import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { useFilters } from "@/context/filters-context";
import { useAppSettings } from "@/context/settings-context";
import { parseDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DateRangePicker() {
  const { filters, setFilters } = useFilters();
  const { minDate, maxDate } = useAppSettings();

  const selected: DateRange | undefined = filters
    ? {
        from: filters.from ? parseDate(filters.from) : undefined,
        to: filters.to ? parseDate(filters.to) : undefined,
      }
    : undefined;

  const label = selected?.from
    ? selected.to
      ? `${format(selected.from, "LLL d, y")} - ${format(selected.to, "LLL d, y")}`
      : format(selected.from, "LLL d, y")
    : "Pick a date range";

  function handleSelect(range: DateRange | undefined) {
    const from = range?.from ? format(range.from, "yyyy-MM-dd") : undefined;
    const to = range?.to ? format(range.to, "yyyy-MM-dd") : undefined;
    setFilters(from || to ? { from, to } : undefined);
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-9 min-w-[202px] justify-start whitespace-nowrap border-transparent shadow-[inset_0_0_0_1px_var(--border)] hover:bg-muted"
          />
        }
      >
        <CalendarIcon className="size-3.5" />
        <span className="ml-3 text-[11px]">{label}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          weekdayFormat="narrow"
          selected={selected}
          onSelect={handleSelect}
          startMonth={minDate}
          endMonth={maxDate}
          disabled={{ before: minDate, after: maxDate }}
          className="[--cell-size:--spacing(8)]"
        />
      </PopoverContent>
    </Popover>
  );
}
