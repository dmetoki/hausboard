import { Frown, Smile, Users } from "lucide-react";
import { Icons } from "@/components/icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IconBadge, StatusBadge } from "@/components/dashboard/icon-badge";
import { compactNumberFormatter } from "@/lib/utils";

export type SocialUser = {
  id: string;
  name: string;
  username: string;
  followers: number;
  source: keyof typeof Icons;
  status: "promoter" | "detractor";
  /** Display text for `status` — owned by the caller/data layer, not this
   * component, so wording can change (localization, rephrasing) without
   * touching the component. */
  statusLabel: string;
};

// Promoter/detractor is a genuine status signal (like sentiment), so it
// earns the same fixed status-color treatment used elsewhere in the
// dashboard — not decorative color, so it's exempt from "keep it colorless".
// Label text is NOT here — see `SocialUser.statusLabel`.
const STATUS_STYLES = {
  promoter: { icon: Smile, color: "--chart-positive" },
  detractor: { icon: Frown, color: "--chart-negative" },
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function UserList({ users }: { users: SocialUser[] }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {users.map((user) => {
        const status = STATUS_STYLES[user.status];

        return (
          <div
            key={user.id}
            className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0"
          >
            <Avatar>
              <AvatarFallback>{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-medium text-foreground">
                {user.name}
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                @{user.username}
              </span>
            </div>
            <span className="flex shrink-0 items-center gap-2 text-xs leading-none text-muted-foreground">
              <IconBadge
                icon={Icons[user.source] ?? Icons.unknown}
                size="size-6"
                iconSize="size-3.5"
                className="text-foreground"
              />
              <span className="flex items-center gap-1 leading-none">
                <Users className="size-3" />
                <span className="inline-block w-9 tabular-nums">
                  {compactNumberFormatter.format(user.followers)}
                </span>
              </span>
            </span>
            <StatusBadge
              icon={status.icon}
              color={status.color}
              label={user.statusLabel}
              size="size-6"
              iconSize="size-3.5"
            />
          </div>
        );
      })}
    </div>
  );
}
