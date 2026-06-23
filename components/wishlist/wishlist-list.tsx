"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { WishlistCard } from "./wishlist-card";

type Wishlist = {
  id: string;
  title: string;
  event_type: string;
  event_date: string | null;
  visibility: string;
  item_count?: number;
};

export function WishlistList() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlists = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("wishlists")
      .select("id, title, event_type, event_date, visibility")
      .order("created_at", { ascending: false });

    setWishlists(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchWishlists(); }, [fetchWishlists]);

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
          className="rounded-lg bg-foreground text-background px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Create your first wishlist
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {wishlists.map((w) => (
        <WishlistCard key={w.id} wishlist={w} onDeleted={fetchWishlists} />
      ))}
    </div>
  );
}
