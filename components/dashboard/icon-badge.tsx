import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

/** A small bordered circle around an icon — used for the source-platform
 * badge in both `UserList` and `PostList`. */
export function IconBadge({
  icon: Icon,
  className,
  size = "size-5",
  iconSize = "size-3",
}: {
  icon: ComponentType<{ className?: string }>;
  className?: string;
  size?: string;
  iconSize?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-muted-foreground/40",
        size,
        className,
      )}
    >
      <Icon className={iconSize} />
    </span>
  );
}

/** A circle tinted with a fixed status color (sentiment, promoter/detractor,
 * etc.) — same `color-mix` tinting convention used throughout the
 * dashboard, so a status color reads consistently everywhere it appears. */
export function StatusBadge({
  icon: Icon,
  color,
  label,
  size = "size-5",
  iconSize = "size-3",
}: {
  icon: ComponentType<{ className?: string }>;
  /** Name of a --chart-* CSS variable, e.g. "--chart-positive". */
  color: string;
  label: string;
  size?: string;
  iconSize?: string;
}) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-full", size)}
      style={{
        backgroundColor: `color-mix(in oklab, var(${color}) 16%, transparent)`,
        color: `var(${color})`,
      }}
      title={label}
    >
      <Icon className={iconSize} />
    </span>
  );
}
