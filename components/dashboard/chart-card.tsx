import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ChartCard({
  title,
  description,
  className,
  centerTitle,
  centerContent,
  stretch,
  children,
}: {
  title?: string;
  description?: string;
  className?: string;
  centerTitle?: boolean;
  centerContent?: boolean;
  /** Lets `children` grow to fill any extra height the grid row forces on
   * this card (e.g. to match a taller sibling), instead of sitting at its
   * intrinsic height with blank space below. */
  stretch?: boolean;
  children: ReactNode;
}) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader className={cn("gap-0.5", centerTitle && "text-center")}>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent
        className={cn(
          title && "mt-2",
          centerContent && "flex flex-1 flex-col justify-center",
          centerContent && title && "pb-6",
          stretch && "flex flex-1 flex-col",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}
