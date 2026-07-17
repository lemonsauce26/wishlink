"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

const VISIBILITY_LABEL: Record<string, string> = {
  public: "Public",
  private: "Private",
  inner_circle: "Inner Circle",
};

type Wishlist = {
  id: string;
  title: string;
  event_type: string;
  event_date: string | null;
  visibility: string;
  item_count?: number;
};

export function WishlistCard({ wishlist, onDeleted }: { wishlist: Wishlist; onDeleted: () => void }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/wishlists/${wishlist.id}`, { method: "DELETE" });
    if (!res.ok) {
      console.error("[WishlistCard] delete failed", wishlist.id, res.status);
      setDeleteError("Failed to delete wishlist. Please try again.");
      setDeleting(false);
      return;
    }
    onDeleted();
  }

  const emoji = EVENT_EMOJI[wishlist.event_type] ?? "🎁";
  const date = wishlist.event_date
    ? new Date(wishlist.event_date + "T00:00:00").toLocaleDateString("en-CA", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/wishlist/${wishlist.id}`} className="flex-1 min-w-0">
          <h2 className="font-semibold text-base">
            {emoji} {wishlist.title}
          </h2>
          {date && <p className="text-sm text-muted-foreground mt-0.5">{date}</p>}
          <p className="text-sm text-muted-foreground mt-0.5">
            {wishlist.item_count ?? 0} items · {VISIBILITY_LABEL[wishlist.visibility]}
          </p>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => router.push(`/wishlist/${wishlist.id}/edit`)}
            aria-label="Edit"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete"
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {confirming && (
        <div className="space-y-2">
          <p className="text-sm text-destructive font-medium">Delete this wishlist?</p>
          {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-lg bg-destructive text-destructive-foreground px-3 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
