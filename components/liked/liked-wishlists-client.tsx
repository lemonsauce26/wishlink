"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ScrollSentinel } from "@/components/ui/scroll-sentinel";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

export type LikedWishlistItem = {
  id: string;
  title: string;
  event_type: string;
  explore_token: string | null;
  nickname: string | null;
};

const LIMIT = 20;

export function LikedWishlistsClient({ initialItems }: { initialItems: LikedWishlistItem[] }) {
  const fetchMore = useCallback(async (page: number): Promise<LikedWishlistItem[]> => {
    const res = await fetch(`/api/liked/wishlists?page=${page}&limit=${LIMIT}`);
    const data = await res.json();
    return data.items ?? [];
  }, []);

  const { items, hasMore, loading, sentinelRef } = useInfiniteScroll({
    initialItems,
    fetchMore,
    limit: LIMIT,
  });

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border p-12 text-center text-muted-foreground space-y-3">
        <p className="text-4xl">🎁</p>
        <p className="font-medium">No liked wishlists yet</p>
        <Link href="/explore" className="text-sm text-emerald-600 hover:underline">
          Browse Explore →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {items.map((w) => {
          const emoji = EVENT_EMOJI[w.event_type] ?? "🎁";
          const href = w.explore_token ? `/explore/${w.explore_token}` : null;
          const inner = (
            <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-secondary transition-colors">
              <span className="text-xl shrink-0">{emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{w.title}</p>
                {w.nickname && (
                  <p className="text-xs text-muted-foreground mt-0.5">@{w.nickname}</p>
                )}
              </div>
            </div>
          );
          return href ? (
            <Link key={w.id} href={href}>{inner}</Link>
          ) : (
            <div key={w.id}>{inner}</div>
          );
        })}
      </div>
      {hasMore && <ScrollSentinel sentinelRef={sentinelRef} loading={loading} />}
    </>
  );
}
