"use client";

import { Building2, Check, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useClerk, useUser } from "@clerk/nextjs";
import { useOrg } from "@/context/org-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const { selectedOrg, setSelectedOrg, orgs, loading: orgsLoading } = useOrg();

  if (!user) return null;

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim() ||
    user.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    "U";

  const CurrentThemeIcon =
    THEME_OPTIONS.find((option) => option.value === theme)?.icon ?? Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-full w-8 shrink-0 items-center justify-center rounded-md p-0 leading-none outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar className="size-8 rounded-md after:rounded-md">
          <AvatarImage
            src={user.imageUrl}
            alt={user.fullName ?? "User"}
            className="rounded-md"
          />
          <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">
                {user.firstName ?? user.fullName ?? "Account"}
              </span>
              {user.primaryEmailAddress && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  {user.primaryEmailAddress.emailAddress}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2.5 text-xs cursor-pointer">
            <Building2 className="size-3.5" />
            Organization
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {orgsLoading ? (
              <DropdownMenuItem disabled className="gap-2.5 py-1.5 text-xs">
                Loading organizations…
              </DropdownMenuItem>
            ) : orgs.length === 0 ? (
              <DropdownMenuItem disabled className="gap-2.5 py-1.5 text-xs">
                No organizations
              </DropdownMenuItem>
            ) : (
              orgs.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  className="gap-2.5 py-1.5 text-xs cursor-pointer"
                  onClick={() => setSelectedOrg(org)}
                >
                  <Avatar className="size-4 rounded-sm after:rounded-sm">
                    <AvatarImage src={org.imageUrl} alt={org.name} />
                    <AvatarFallback className="text-[9px]">
                      {org.name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{org.name}</span>
                  {selectedOrg?.id === org.id && (
                    <Check className="ml-auto size-3.5" />
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="gap-2.5 text-xs cursor-pointer">
            <CurrentThemeIcon className="size-3.5" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem
                key={value}
                className="gap-2.5 py-1.5 text-xs cursor-pointer"
                onClick={() => setTheme(value)}
              >
                <Icon className="size-3.5" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2.5 text-xs cursor-pointer"
          onClick={() => {
            signOut().then(() => {
              window.location.href = "/sign-in";
            });
          }}
        >
          <LogOut className="size-3.5" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
