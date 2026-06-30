"use client";

import { useState } from "react";

type WishItem = {
  id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string;
  store_name: string | null;
  product_url: string | null;
  priority: "high" | "medium" | "low";
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

export function ShareItemList({ items }: { items: WishItem[] }) {
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
        <div key={item.id} className="rounded-xl border border-border p-4 flex gap-4 items-start">
          <div className="w-16 h-16 rounded-lg border border-border bg-secondary flex-shrink-0 overflow-hidden">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-medium truncate">{item.title}</p>
            <p className="text-sm text-muted-foreground">
              {item.price != null && `$${item.price} ${item.currency ?? "CAD"}`}
              {item.store_name && item.price != null && " · "}
              {item.store_name}
            </p>
            {item.product_url && (
              <a
                href={item.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                View Product
              </a>
            )}
          </div>
          <button
            disabled
            className="flex-shrink-0 rounded-lg border border-border px-3 py-1.5 text-sm font-medium opacity-60 cursor-not-allowed"
            title="Coming soon"
          >
            🎁 I&apos;ll Get This!
          </button>
        </div>
      ))}
    </div>
  );
}
