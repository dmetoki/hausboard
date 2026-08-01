import { House } from "lucide-react";
import { Nav } from "@/components/layout/nav";
import { MobileNav } from "@/components/layout/mobile-nav";
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
          <span className="text-base font-semibold text-foreground uppercase">Hausboard</span>
          <span className="-mt-0.5 text-[11px] text-muted-foreground">Your tagline here</span>
        </div>
        <Nav className="ml-8" />
        <div className="ml-auto flex h-9 items-center gap-1.5">
          <DateRangePicker />
          <NotificationsMenu />
          <UserMenu />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
