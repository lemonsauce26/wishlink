"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { WishItemForm } from "./wish-item-form";

const PRIORITY_CONFIG = {
  high: { dot: "bg-yellow-400", label: "High Priority" },
  medium: { dot: "bg-blue-400", label: "Medium Priority" },
  low: { dot: "bg-muted-foreground/30", label: "Low Priority" },
};

const RECEIVING_LABEL: Record<string, string> = {
  pickup: "Pickup",
  shipping: "Ship it to me",
  either: "Either is fine",
  digital: "Digital",
};

type WishItem = {
  id: string;
  wishlist_id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string;
  product_url: string | null;
  store_name: string | null;
  priority: "high" | "medium" | "low";
  quantity: number;
  note: string | null;
  receiving_method: "pickup" | "shipping" | "either" | "digital";
  receiving_detail: string | null;
};

type Props = {
  item: WishItem;
  wishlistId: string;
  isOwner: boolean;
};

export function WishItemDetail({ item, wishlistId, isOwner }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const priority = PRIORITY_CONFIG[item.priority];

  async function handleDelete() {
    setDeleting(true);
    const supabase = createClient();
    await supabase.from("wish_items").delete().eq("id", item.id);
    router.push(`/wishlist/${wishlistId}`);
    router.refresh();
  }

  if (mode === "edit") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Edit Item</h1>
        <WishItemForm
          mode="edit"
          wishlistId={wishlistId}
          itemId={item.id}
          defaultValues={{
            title: item.title,
            image_url: item.image_url ?? "",
            price: item.price != null ? String(item.price) : "",
            currency: item.currency,
            product_url: item.product_url ?? "",
            store_name: item.store_name ?? "",
            priority: item.priority,
            quantity: item.quantity,
            note: item.note ?? "",
            receiving_method: item.receiving_method,
            receiving_detail: item.receiving_detail ?? "",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Image */}
      {item.image_url && (
        <div className="w-full aspect-video rounded-xl border border-border overflow-hidden bg-secondary">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" />
        </div>
      )}

      {/* Title + meta */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
            <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
            <span className="text-xs text-muted-foreground">{priority.label}</span>
          </div>
        </div>

        {(item.price != null || item.store_name) && (
          <p className="text-lg font-medium mt-1">
            {item.price != null && `$${item.price.toFixed(2)} ${item.currency}`}
            {item.store_name && (
              <span className="text-muted-foreground font-normal text-base"> · {item.store_name}</span>
            )}
          </p>
        )}
      </div>

      {/* Product link */}
      {item.product_url && (
        <a
          href={item.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
        >
          View Product ↗
        </a>
      )}

      {/* Details */}
      <div className="rounded-xl border border-border divide-y divide-border">
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Quantity</span>
          <span className="font-medium">{item.quantity}</span>
        </div>
        <div className="flex justify-between px-4 py-3 text-sm">
          <span className="text-muted-foreground">Receiving</span>
          <span className="font-medium">{RECEIVING_LABEL[item.receiving_method]}</span>
        </div>
        {item.receiving_detail && (
          <div className="px-4 py-3 text-sm">
            <p className="text-muted-foreground mb-0.5">Receiving detail</p>
            <p>{item.receiving_detail}</p>
          </div>
        )}
        {item.note && (
          <div className="px-4 py-3 text-sm">
            <p className="text-muted-foreground mb-0.5">Note</p>
            <p>{item.note}</p>
          </div>
        )}
      </div>

      {/* Owner actions */}
      {isOwner && (
        confirming ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive font-medium">Delete this item?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-destructive text-destructive-foreground px-3 py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setMode("edit")}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              Delete
            </button>
          </div>
        )
      )}
    </div>
  );
}
