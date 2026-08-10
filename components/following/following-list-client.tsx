"use client";

import { useCallback } from "react";
import Link from "next/link";
import { ScrollSentinel } from "@/components/ui/scroll-sentinel";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

export type FollowingUser = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  followerCount: number;
};

const LIMIT = 20;

export function FollowingListClient({ initialItems }: { initialItems: FollowingUser[] }) {
  const fetchMore = useCallback(async (page: number): Promise<FollowingUser[]> => {
    const res = await fetch(`/api/following?page=${page}&limit=${LIMIT}`);
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
      <div className="space-y-2">
        {items.map((u) => (
          <Link
            key={u.id}
            href={`/explore/user/${encodeURIComponent(u.nickname)}`}
            className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-secondary/40 transition-colors"
          >
            <div
              className="rounded-full overflow-hidden bg-secondary border border-border shrink-0"
              style={{ width: 40, height: 40 }}
            >
              {u.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={u.avatar_url}
                  alt={u.nickname}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {u.nickname[0]?.toUpperCase() ?? "?"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">@{u.nickname}</p>
              {u.followerCount > 0 && (
                <p className="text-xs text-muted-foreground">{u.followerCount} followers</p>
              )}
            </div>
          </Link>
        ))}
      </div>
      {hasMore && <ScrollSentinel sentinelRef={sentinelRef} loading={loading} />}
    </>
  );
}
