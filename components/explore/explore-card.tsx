import Link from "next/link";
import { Heart, Bookmark, Copy, Package } from "lucide-react";
import { EVENT_EMOJI, EVENT_INFOS } from "@/lib/constants/event-infos";

interface PreviewItem {
  id: string;
  title: string;
  image_url: string | null;
}

interface ExploreCardProps {
  wishlist: {
    title: string;
    event_type: string;
    explore_token: string;
  };
  nickname: string;
  itemCount: number;
  previewItems: PreviewItem[];
  likeCount: number;
  saveCount: number;
  copyCount: number;
}

export function ExploreCard({
  wishlist,
  nickname,
  itemCount,
  previewItems,
  likeCount,
  saveCount,
  copyCount,
}: ExploreCardProps) {
  const emoji = EVENT_EMOJI[wishlist.event_type] ?? "🎁";
  const eventLabel = EVENT_INFOS.find((e) => e.value === wishlist.event_type)?.label ?? wishlist.event_type;

  return (
    <div className="rounded-xl border border-border p-4 hover:bg-secondary/40 transition-colors space-y-3">
      <div>
        <Link
          href={`/explore/${wishlist.explore_token}`}
          className="block font-semibold hover:underline underline-offset-2"
        >
          {emoji} {wishlist.title}
        </Link>
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          <div className="flex items-center gap-1 flex-1 min-w-0 text-xs text-muted-foreground overflow-hidden">
            <Link
              href={`/explore/user/${nickname}`}
              className="truncate shrink min-w-0 hover:underline underline-offset-2"
            >
              @{nickname || "—"}
            </Link>
            <span className="shrink-0 text-muted-foreground/40">·</span>
            <span className="flex items-center gap-0.5 shrink-0"><Package className="w-3 h-3" />{itemCount}<span className="hidden sm:inline">&nbsp;items</span></span>
            <span className="shrink-0 text-muted-foreground/40">·</span>
            <span className="flex items-center gap-0.5 shrink-0"><Heart className="w-3 h-3" />{likeCount}<span className="hidden sm:inline">&nbsp;likes</span></span>
            <span className="shrink-0 text-muted-foreground/40">·</span>
            <span className="flex items-center gap-0.5 shrink-0"><Bookmark className="w-3 h-3" />{saveCount}<span className="hidden sm:inline">&nbsp;saved items</span></span>
            <span className="shrink-0 text-muted-foreground/40">·</span>
            <span className="flex items-center gap-0.5 shrink-0"><Copy className="w-3 h-3" />{copyCount}<span className="hidden sm:inline">&nbsp;copies</span></span>
          </div>
          <span className="text-xs bg-secondary border border-border rounded-full px-2.5 py-1 text-muted-foreground whitespace-nowrap shrink-0">
            {emoji} {eventLabel}
          </span>
        </div>
      </div>

      <Link href={`/explore/${wishlist.explore_token}`} className="block">
        {previewItems.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewItems.map((item) => (
              <div
                key={item.id}
                className="aspect-square rounded-lg overflow-hidden bg-secondary border border-border"
              >
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px] px-1 text-center leading-tight">
                    {item.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Link>
    </div>
  );
}
