import { ChartNoAxesColumn, Frown, Meh, Smile, ThumbsUp } from "lucide-react";
import { Icons } from "@/components/icons";
import { IconBadge, StatusBadge } from "@/components/dashboard/icon-badge";
import { compactNumberFormatter } from "@/lib/utils";

export type SocialPost = {
  id: string;
  text: string;
  channel: keyof typeof Icons;
  impressions: number;
  likes: number;
  sentiment: "positive" | "negative" | "neutral";
  /** Display text for `sentiment` — owned by the caller/data layer, not this
   * component, so wording can change (localization, rephrasing) without
   * touching the component. */
  sentimentLabel: string;
};

// Same fixed status-style palette used for sentiment everywhere else in the
// dashboard (mirror chart, stacked bar, user list) — not decorative color.
// Label text is NOT here — see `SocialPost.sentimentLabel`.
const SENTIMENT_STYLES = {
  positive: { icon: Smile, color: "--chart-positive" },
  negative: { icon: Frown, color: "--chart-negative" },
  neutral: { icon: Meh, color: "--chart-neutral" },
} as const;

export function PostList({ posts }: { posts: SocialPost[] }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {posts.map((post) => {
        const sentiment = SENTIMENT_STYLES[post.sentiment];

        return (
          <div key={post.id} className="flex flex-col gap-2.5 py-3.5 first:pt-0 last:pb-0">
            <p className="line-clamp-2 text-xs leading-5 text-foreground">{post.text}</p>
            <div className="flex items-center gap-5 leading-none text-muted-foreground">
              <IconBadge
                icon={Icons[post.channel] ?? Icons.unknown}
                className="text-foreground"
              />
              <span className="flex items-center gap-1 text-xs tabular-nums">
                <ChartNoAxesColumn className="size-3 shrink-0" />
                <span className="inline-block w-9">
                  {compactNumberFormatter.format(post.impressions)}
                </span>
              </span>
              <span className="flex items-center gap-1 text-xs tabular-nums">
                <ThumbsUp className="size-3 shrink-0" />
                <span className="inline-block w-9">
                  {compactNumberFormatter.format(post.likes)}
                </span>
              </span>
              <StatusBadge
                icon={sentiment.icon}
                color={sentiment.color}
                label={post.sentimentLabel}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
