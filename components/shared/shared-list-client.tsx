"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ScrollSentinel } from "@/components/ui/scroll-sentinel";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

export type SharedWishlistItem = {
  id: string;
  title: string;
  share_token: string;
  event_type: string;
  ownerName: string;
};

const LIMIT = 20;

export function SharedListClient({ initialItems }: { initialItems: SharedWishlistItem[] }) {
  const fetchMore = useCallback(async (page: number): Promise<SharedWishlistItem[]> => {
    const res = await fetch(`/api/shared?page=${page}&limit=${LIMIT}`);
    const data = await res.json();
    return data.items ?? [];
  }, []);

  const { items, hasMore, loading, sentinelRef } = useInfiniteScroll({
    initialItems,
    fetchMore,
    limit: LIMIT,
  });

  return (
    <>
      <div className="space-y-3">
        {items.map((wl) => {
          const emoji = EVENT_EMOJI[wl.event_type] ?? "🎁";
          return (
            <Link
              key={wl.id}
              href={`/share/${wl.share_token}`}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-4 hover:bg-secondary/40 transition-colors"
            >
              <span className="text-xl">{emoji}</span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{wl.ownerName}의</p>
                <p className="font-medium truncate">{wl.title}</p>
              </div>
            </Link>
          );
        })}
      </div>
      {hasMore && <ScrollSentinel sentinelRef={sentinelRef} loading={loading} />}
    </>
  );
}
