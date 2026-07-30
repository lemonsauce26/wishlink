"use client";

import { useState } from "react";
import { LoginRequiredModal } from "@/components/explore/login-required-modal";
import { CopyWishlistModal } from "@/components/explore/copy-wishlist-modal";

export function ExploreDetailClient({
  wishlistId,
  wishlistTitle,
  isLoggedIn,
  initialLiked,
  initialLikeCount,
  initialCopyCount,
}: {
  wishlistId: string;
  wishlistTitle: string;
  isLoggedIn: boolean;
  initialLiked: boolean;
  initialLikeCount: number;
  initialCopyCount: number;
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [copyCount, setCopyCount] = useState(initialCopyCount);
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (loading) return;

    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => c + (newLiked ? 1 : -1));

    setLoading(true);
    try {
      const res = await fetch(`/api/wishlists/${wishlistId}/like`, { method: "POST" });
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.count);
    } catch {
      setLiked(!newLiked);
      setLikeCount((c) => c + (newLiked ? -1 : 1));
    }
    setLoading(false);
  }

  function handleCopy(e: React.MouseEvent) {
    (e.currentTarget as HTMLButtonElement).blur();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setShowCopyModal(true);
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={(e) => { (e.currentTarget as HTMLButtonElement).blur(); handleLike(); }}
          disabled={loading}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            liked
              ? "border-rose-400 text-rose-500 bg-rose-50 dark:bg-rose-950/30"
              : "border-border hover:bg-secondary"
          }`}
        >
          {liked ? "❤️" : "🤍"} Like {likeCount}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
        >
          🔖 Copy Wishlist {copyCount}
        </button>
      </div>
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}
      {showCopyModal && (
        <CopyWishlistModal
          wishlistId={wishlistId}
          wishlistTitle={wishlistTitle}
          onClose={() => setShowCopyModal(false)}
          onCopied={() => setCopyCount((c) => c + 1)}
        />
      )}
    </>
  );
}
