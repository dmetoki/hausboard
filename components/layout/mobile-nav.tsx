"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerPopup,
  DrawerPortal,
  DrawerTrigger,
  DrawerViewport,
} from "@/components/ui/drawer";

// The hamburger + bottom-sheet menu shown in place of `Nav` below md — same
// items, but full label rows instead of icon-only buttons, since there's no
// room to fit both this and the header's own right-hand controls otherwise.
export function MobileNav() {
  const pathname = usePathname();

  return (
    <Drawer>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border-transparent shadow-[inset_0_0_0_1px_var(--border)] hover:bg-muted md:hidden"
          />
        }
      >
        <Menu className="size-4" />
      </DrawerTrigger>
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup>
            <nav className="flex flex-col divide-y divide-border">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname?.startsWith(`${href}/`);

                return (
                  <DrawerClose
                    key={href}
                    nativeButton={false}
                    render={<Link href={href} />}
                    className={cn(
                      "flex items-center gap-3 py-3.5 text-sm font-medium first:pt-2",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    {label}
                    {active && (
                      <span className="ml-auto size-1.5 shrink-0 bg-primary" />
                    )}
                  </DrawerClose>
                );
              })}
            </nav>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}
