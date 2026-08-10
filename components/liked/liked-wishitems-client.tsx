"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ScrollSentinel } from "@/components/ui/scroll-sentinel";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

export type LikedWishItem = {
  id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string | null;
  store_name: string | null;
  explore_token: string | null;
};

const LIMIT = 20;

export function LikedWishItemsClient({ initialItems }: { initialItems: LikedWishItem[] }) {
  const fetchMore = useCallback(async (page: number): Promise<LikedWishItem[]> => {
    const res = await fetch(`/api/liked/wishitems?page=${page}&limit=${LIMIT}`);
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
        <p className="text-4xl">❤️</p>
        <p className="font-medium">No liked wish items yet</p>
        <Link href="/explore" className="text-sm text-emerald-600 hover:underline">
          Browse Explore →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {items.map((item) => {
          const exploreHref = item.explore_token ? `/explore/${item.explore_token}` : null;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
            >
              {item.image_url && (
                <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-secondary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.title}</p>
                {item.price != null && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.currency} {item.price.toLocaleString()}
                  </p>
                )}
                {item.store_name && (
                  <p className="text-xs text-muted-foreground">{item.store_name}</p>
                )}
              </div>
              {exploreHref && (
                <Link
                  href={exploreHref}
                  className="shrink-0 p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  title="위시리스트 보기"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
      {hasMore && <ScrollSentinel sentinelRef={sentinelRef} loading={loading} />}
    </>
  );
}
