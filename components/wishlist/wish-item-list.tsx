"use client";

import { useState } from "react";
import { WishItemCard } from "./wish-item-card";

type WishItem = {
  id: string;
  wishlist_id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string;
  store_name: string | null;
  priority: "high" | "medium" | "low";
  quantity: number;
  created_at: string;
};

type SortOption = "priority" | "recent" | "price_asc" | "price_desc";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortItems(items: WishItem[], sort: SortOption): WishItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "priority":
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      case "recent":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "price_asc":
        return (a.price ?? 0) - (b.price ?? 0);
      case "price_desc":
        return (b.price ?? 0) - (a.price ?? 0);
    }
  });
}

type Props = {
  items: WishItem[];
  isOwner?: boolean;
  reservationCountMap?: Record<string, number>;
};

export function WishItemList({ items, isOwner = false, reservationCountMap = {} }: Props) {
  const [sort, setSort] = useState<SortOption>("priority");
  const sorted = sortItems(items, sort);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="priority">Sort: Priority</option>
          <option value="recent">Sort: Recently Added</option>
          <option value="price_asc">Sort: Price ↑</option>
          <option value="price_desc">Sort: Price ↓</option>
        </select>
      </div>
      {sorted.map((item) => (
        <WishItemCard
          key={item.id}
          item={item}
          isOwner={isOwner}
          reservationCount={reservationCountMap[item.id] ?? 0}
        />
      ))}
    </div>
  );
}
