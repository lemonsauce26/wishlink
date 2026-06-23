"use client";

import Link from "next/link";

const PRIORITY_CONFIG = {
  high: { dot: "bg-yellow-400", label: "High" },
  medium: { dot: "bg-blue-400", label: "Medium" },
  low: { dot: "bg-muted-foreground/30", label: "Low" },
};

type WishItem = {
  id: string;
  wishlist_id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string;
  store_name: string | null;
  priority: "high" | "medium" | "low";
};

export function WishItemCard({ item }: { item: WishItem }) {
  const priority = PRIORITY_CONFIG[item.priority];

  return (
    <Link
      href={`/wishlist/${item.wishlist_id}/item/${item.id}`}
      className="flex items-center gap-4 rounded-xl border border-border p-4 hover:bg-secondary/50 transition-colors"
    >
      <div className="w-16 h-16 rounded-lg border border-border bg-secondary flex-shrink-0 overflow-hidden">
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {item.price != null && (
            <span className="text-sm text-muted-foreground">
              ${item.price.toFixed(2)} {item.currency}
            </span>
          )}
          {item.store_name && (
            <span className="text-xs text-muted-foreground">· {item.store_name}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
        <span className="text-xs text-muted-foreground">{priority.label}</span>
      </div>
    </Link>
  );
}
