"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, ChartLine, FileText, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// One entry per section — Brand Reputation is the only one with a real page
// today (the homepage "/" is a placeholder redirect to it, see
// app/(app)/page.tsx); the rest are upcoming sections. Exported so
// `MobileNav` renders the exact same set instead of keeping its own copy.
export const NAV_ITEMS = [
  { href: "/brand-reputation", label: "Brand Reputation", icon: ChartLine },
  { href: "/posts", label: "Posts", icon: FileText },
  { href: "/bot", label: "Bot", icon: Bot },
  { href: "/inbox", label: "Inbox", icon: Inbox },
] as const;

// Hidden below md — mobile gets the same items through `MobileNav`'s
// hamburger menu instead, where there's room for a label next to each icon.
export function Nav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("hidden h-9 items-center gap-5 md:flex", className)}>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);

        return (
          <Button
            key={href}
            variant="ghost"
            size="icon"
            aria-current={active ? "page" : undefined}
            title={label}
            nativeButton={false}
            render={<Link href={href} />}
            className={cn(
              "h-8 w-8 border-transparent",
              active
                ? "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_20%,transparent)]"
                : "hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
          </Button>
        );
      })}
    </nav>
  );
}
