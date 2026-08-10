"use client";

import { useCallback } from "react";
import { ExploreCard } from "./explore-card";
import { ScrollSentinel } from "@/components/ui/scroll-sentinel";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

export type ExploreCardData = {
  id: string;
  title: string;
  event_type: string;
  explore_token: string;
  nickname: string;
  itemCount: number;
  previewItems: { id: string; title: string; image_url: string | null }[];
  likeCount: number;
  saveCount: number;
  copyCount: number;
};

const LIMIT = 20;

export function ExploreListClient({
  initialItems,
  filter,
  sort,
}: {
  initialItems: ExploreCardData[];
  filter: string;
  sort: string;
}) {
  const fetchMore = useCallback(
    async (page: number): Promise<ExploreCardData[]> => {
      const res = await fetch(
        `/api/explore?page=${page}&limit=${LIMIT}&filter=${filter}&sort=${sort}`
      );
      const data = await res.json();
      return data.items ?? [];
    },
    [filter, sort]
  );

  const { items, hasMore, loading, sentinelRef } = useInfiniteScroll({
    initialItems,
    fetchMore,
    limit: LIMIT,
  });

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
        <p className="text-4xl">🔍</p>
        <p className="font-medium">No wishlists yet</p>
        <p className="text-sm">Be the first to share your wishlist!</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((wl) => (
          <ExploreCard
            key={wl.id}
            wishlist={{ title: wl.title, event_type: wl.event_type, explore_token: wl.explore_token }}
            nickname={wl.nickname}
            itemCount={wl.itemCount}
            previewItems={wl.previewItems}
            likeCount={wl.likeCount}
            saveCount={wl.saveCount}
            copyCount={wl.copyCount}
          />
        ))}
      </div>
      {hasMore && <ScrollSentinel sentinelRef={sentinelRef} loading={loading} />}
    </>
  );
}
