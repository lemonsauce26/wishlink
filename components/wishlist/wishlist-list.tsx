"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WishlistCard } from "./wishlist-card";
import { ScrollSentinel } from "@/components/ui/scroll-sentinel";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";

type Wishlist = {
  id: string;
  title: string;
  event_type: string;
  event_date: string | null;
  visibility: string;
  item_count?: number;
};

const SORT_OPTIONS = [
  { label: "Newest", sort: "created_at", order: "desc" },
  { label: "Recently updated", sort: "updated_at", order: "desc" },
  { label: "Name A–Z", sort: "title", order: "asc" },
  { label: "Event date", sort: "event_date", order: "asc" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number];

const LIMIT = 20;

function WishlistInfiniteList({
  initialItems,
  sortOption,
  onDeleted,
}: {
  initialItems: Wishlist[];
  sortOption: SortOption;
  onDeleted: () => void;
}) {
  const fetchMore = useCallback(
    async (page: number): Promise<Wishlist[]> => {
      const res = await fetch(
        `/api/wishlists?sort=${sortOption.sort}&order=${sortOption.order}&page=${page}&limit=${LIMIT}`
      );
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    [sortOption]
  );

  const { items, hasMore, loading, sentinelRef } = useInfiniteScroll({
    initialItems,
    fetchMore,
    limit: LIMIT,
  });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((w) => (
          <WishlistCard key={w.id} wishlist={w} onDeleted={onDeleted} />
        ))}
      </div>
      {hasMore && <ScrollSentinel sentinelRef={sentinelRef} loading={loading} />}
    </>
  );
}

export function WishlistList() {
  const [sortIndex, setSortIndex] = useState(0);
  const [initialItems, setInitialItems] = useState<Wishlist[] | null>(null);
  const [key, setKey] = useState(0);

  const loadInitial = useCallback(async (opt: SortOption) => {
    setInitialItems(null);
    const res = await fetch(`/api/wishlists?sort=${opt.sort}&order=${opt.order}&page=1&limit=${LIMIT}`);
    const data = await res.json();
    setInitialItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadInitial(SORT_OPTIONS[sortIndex]);
  }, [loadInitial, sortIndex]);

  const handleRefresh = useCallback(() => {
    setKey((k) => k + 1);
    loadInitial(SORT_OPTIONS[sortIndex]);
  }, [loadInitial, sortIndex]);

  if (initialItems === null) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (initialItems.length === 0 && key === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <span className="text-5xl">🎁</span>
        <div>
          <p className="font-medium">No wishlists yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first wishlist and start adding items.</p>
        </div>
        <Link
          href="/wishlist/new"
          className="rounded-lg bg-emerald-600 text-white px-5 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Create your first wishlist
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select
          value={sortIndex}
          onChange={(e) => setSortIndex(Number(e.target.value))}
          className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SORT_OPTIONS.map((opt, i) => (
            <option key={opt.sort + opt.order} value={i}>{opt.label}</option>
          ))}
        </select>
      </div>
      <WishlistInfiniteList
        key={`${sortIndex}-${key}`}
        initialItems={initialItems}
        sortOption={SORT_OPTIONS[sortIndex]}
        onDeleted={handleRefresh}
      />
    </div>
  );
}
