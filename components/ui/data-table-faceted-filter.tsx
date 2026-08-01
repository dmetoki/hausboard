"use client"

import type { ReactNode } from "react"
import { Check, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type FacetedFilterOption = {
  label: string
  value: string
  /** Rendered as-is, so callers control size/color (e.g. a channel-platform
   * icon vs. a sentiment icon tinted with its status color). */
  icon?: ReactNode
}

/**
 * A searchable multi-select filter for a table toolbar — the standard
 * shadcn "faceted filter" pattern (dashed trigger, badge count, a Command
 * combobox for the option list) so it stays usable once a column has more
 * than a handful of options, not just these two. Built generically enough
 * to reuse for any column: pass a title, its options, and the controlled
 * selection.
 */
export function DataTableFacetedFilter({
  title,
  options,
  selected,
  onSelectedChange,
  className,
  align = "start",
  contentClassName,
}: {
  title: string
  options: FacetedFilterOption[]
  selected: string[]
  onSelectedChange: (values: string[]) => void
  className?: string
  /** Which edge of the trigger the popup aligns to — "end" for filters near
   * the right edge of their container, where "start" would overflow. */
  align?: "start" | "center" | "end"
  /** Overrides the popup's default width — a filter with longer labels
   * (e.g. full country names, not 3-letter codes) may need more than `w-52`. */
  contentClassName?: string
}) {
  const selectedSet = new Set(selected)

  function toggle(value: string) {
    onSelectedChange(
      selectedSet.has(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    )
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn("h-8 gap-2 border-dashed text-xs", className)}
          />
        }
      >
        <PlusCircle className="size-3.5" />
        {title}
        {/* Always mounted (just hidden at 0) so the badge's width is part of
            the button's layout from the start — toggling a selection can't
            then shift the button (and everything after it) sideways. */}
        <Separator
          orientation="vertical"
          className={cn("mx-1 h-4", selectedSet.size === 0 && "invisible")}
        />
        <Badge
          variant="secondary"
          className={cn(
            "min-w-4 justify-center rounded-sm px-0 font-normal tabular-nums",
            selectedSet.size === 0 && "invisible"
          )}
        >
          {selectedSet.size || 0}
        </Badge>
      </PopoverTrigger>
      <PopoverContent align={align} className={cn("w-52 p-0", contentClassName)}>
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                  >
                    <span
                      className={cn(
                        "flex size-3.5 shrink-0 items-center justify-center border border-muted-foreground/40",
                        isSelected && "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </span>
                    {option.icon}
                    {option.label}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
