"use client";

import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Chat } from "@/components/bot/chat";
import type {
  MirrorAreaChartPoint,
  MirrorAreaChartSeries,
} from "@/components/dashboard/charts/mirror-area-chart";
import { formatCompactNumber, parseDate } from "@/lib/utils";

/**
 * Opens from a `MirrorAreaChart` click — shows the clicked date's per-series
 * values, plus a chat interface underneath meant to let a user drill into
 * that date's data conversationally. The chat is a static placeholder for
 * now (empty history, no-op submit) — not wired to a real backend yet.
 */
export function SentimentPointSheet({
  point,
  series,
  onOpenChange,
}: {
  point: MirrorAreaChartPoint | null;
  series: MirrorAreaChartSeries[];
  onOpenChange: (open: boolean) => void;
}) {
  const dateValue = point ? String(point.date) : undefined;

  return (
    <Sheet open={point !== null} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md">
        <SheetHeader>
          <SheetTitle>
            {dateValue ? format(parseDate(dateValue), "MMMM d, yyyy") : ""}
          </SheetTitle>
          <SheetDescription>Sentiment breakdown for this date</SheetDescription>
        </SheetHeader>

        {point && (
          <div className="flex flex-col gap-2 border-b border-border pb-4 text-xs">
            {series.map(({ field, label, color }) => (
              <div key={field} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {label}
                </span>
                <span className="font-semibold text-foreground">
                  {formatCompactNumber(Number(point[field]) || 0)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1">
          <Chat messages={[]} isReplying={false} onSubmit={() => {}} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
