"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useInfiniteScroll<T>({
  initialItems,
  fetchMore,
  limit,
}: {
  initialItems: T[];
  fetchMore: (page: number) => Promise<T[]>;
  limit: number;
}) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialItems.length === limit);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const newItems = await fetchMore(nextPage);
      setItems((prev) => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(newItems.length === limit);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, fetchMore, limit]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return { items, hasMore, loading, sentinelRef };
}
