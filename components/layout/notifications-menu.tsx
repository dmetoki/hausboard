"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_NOTIFICATIONS } from "@/lib/mock-metrics";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationsMenu() {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 border-transparent shadow-[inset_0_0_0_1px_var(--border)] hover:bg-muted"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-3 items-center justify-center bg-destructive text-[8px] font-medium text-white">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <span className="text-xs font-medium text-muted-foreground">Notifications</span>
          <Link
            href="/inbox"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </div>
        <DropdownMenuSeparator />
        {MOCK_NOTIFICATIONS.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="flex-col items-start gap-0.5 py-2 whitespace-normal"
          >
            <div className="flex w-full items-center gap-1.5">
              {!notification.read && (
                <span className="size-1.5 shrink-0 bg-primary" />
              )}
              <span className="text-xs font-medium text-foreground">
                {notification.title}
              </span>
              <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                {notification.time}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {notification.description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
