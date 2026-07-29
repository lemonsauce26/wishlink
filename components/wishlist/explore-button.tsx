"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export function ExploreButton({
  wishlistId,
  exploreToken,
  visibility,
}: {
  wishlistId: string;
  exploreToken: string | null;
  visibility: string;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const isPosted = !!exploreToken;

  if (visibility !== "public") return null;

  async function post() {
    setLoading(true);
    setShowConfirm(false);
    await fetch(`/api/wishlists/${wishlistId}/explore`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  async function unpost() {
    setLoading(true);
    await fetch(`/api/wishlists/${wishlistId}/explore`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => (isPosted ? unpost() : setShowConfirm(true))}
        disabled={loading}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          isPosted
            ? "border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            : "border-border hover:bg-secondary"
        }`}
      >
        {loading ? "…" : isPosted ? "✓ On Explore" : "Post to Explore"}
      </button>

      {showConfirm &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-6"
            onClick={() => setShowConfirm(false)}
          >
            <div
              className="bg-background rounded-2xl p-6 w-full max-w-xs shadow-xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Post to Explore?</p>
                <p className="text-sm text-muted-foreground">
                  Your wishlist will be visible to everyone on the Explore page.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={post}
                  className="flex-1 rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
