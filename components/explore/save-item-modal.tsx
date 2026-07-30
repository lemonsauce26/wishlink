"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

interface Wishlist {
  id: string;
  title: string;
  event_type: string;
}

export function SaveItemModal({
  itemId,
  onClose,
}: {
  itemId: string;
  onClose: () => void;
}) {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/wishlists")
      .then((r) => r.json())
      .then((data) => {
        setWishlists(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  async function handleSave(wishlistId: string) {
    if (saving) return;
    setSaving(true);
    try {
      await fetch(`/api/wish-items/${itemId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_wishlist_id: wishlistId }),
      });
      setSavedId(wishlistId);
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-base">Save to wishlist</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
        ) : wishlists.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No wishlists yet. Create one first!
          </div>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {wishlists.map((wl) => {
              const isSaved = savedId === wl.id;
              const emoji = EVENT_EMOJI[wl.event_type] ?? "🎁";
              return (
                <li key={wl.id}>
                  <button
                    onClick={() => handleSave(wl.id)}
                    disabled={saving || !!savedId}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${
                      isSaved
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="flex-1 truncate font-medium">{wl.title}</span>
                    {isSaved && <span className="text-xs">Saved ✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {savedId && (
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-sm font-medium transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
