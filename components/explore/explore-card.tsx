import Link from "next/link";
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
}

export function ExploreCard({
  wishlist,
  nickname,
  itemCount,
  previewItems,
}: ExploreCardProps) {
  const emoji = EVENT_EMOJI[wishlist.event_type] ?? "🎁";
  const eventLabel = EVENT_INFOS.find((e) => e.value === wishlist.event_type)?.label ?? wishlist.event_type;

  return (
    <Link
      href={`/explore/${wishlist.explore_token}`}
      className="block rounded-xl border border-border p-4 hover:bg-secondary/40 transition-colors space-y-3"
    >
      <div>
        <p className="font-semibold">
          {emoji} {wishlist.title}
        </p>
        <div className="flex items-center mt-0.5">
          <p className="text-xs text-muted-foreground">
            @{nickname || "—"} · {itemCount} items
          </p>
          <span className="ml-auto text-xs bg-secondary border border-border rounded-full px-2.5 py-1 text-muted-foreground whitespace-nowrap">
            {emoji} {eventLabel}
          </span>
        </div>
      </div>

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
  );
}
