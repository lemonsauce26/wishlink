"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { WishlistCard } from "./wishlist-card";

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

export function WishlistList() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortIndex, setSortIndex] = useState(0);

  const fetchWishlists = useCallback(async (opt: SortOption) => {
    setLoading(true);
    const res = await fetch(`/api/wishlists?sort=${opt.sort}&order=${opt.order}`);
    const data = await res.json();
    setWishlists(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWishlists(SORT_OPTIONS[sortIndex]);
  }, [fetchWishlists, sortIndex]);

  const handleRefresh = useCallback(() => {
    fetchWishlists(SORT_OPTIONS[sortIndex]);
  }, [fetchWishlists, sortIndex]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (wishlists.length === 0) {
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
      <div className="grid gap-4 sm:grid-cols-2">
        {wishlists.map((w) => (
          <WishlistCard key={w.id} wishlist={w} onDeleted={handleRefresh} />
        ))}
      </div>
    </div>
  );
}
