import { House } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { DateRangePicker } from "@/components/layout/date-range-picker";

export function Header() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-border bg-popover">
      <div className="flex h-full items-center gap-3 px-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <House className="size-5" />
        </div>
        <div className="flex flex-col justify-center leading-tight">
          <span className="text-base font-semibold text-foreground">Hausboard</span>
          <span className="text-xs text-muted-foreground">Your tagline here</span>
        </div>
        <div className="ml-auto flex h-9 items-center gap-1.5">
          <DateRangePicker />
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
