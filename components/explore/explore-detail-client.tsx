"use client";

import { useState } from "react";
import { LoginRequiredModal } from "@/components/explore/login-required-modal";

export function ExploreDetailClient({
  wishlistId,
  isLoggedIn,
  initialLiked,
  initialLikeCount,
}: {
  wishlistId: string;
  isLoggedIn: boolean;
  initialLiked: boolean;
  initialLikeCount: number;
}) {
  const [showModal, setShowModal] = useState(false);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  async function handleLike() {
    if (!isLoggedIn) {
      setShowModal(true);
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

  function handleCopy() {
    if (!isLoggedIn) {
      setShowModal(true);
    }
    // 8-4 implementation
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
          🔖 Copy Wishlist
        </button>
      </div>
      {showModal && <LoginRequiredModal onClose={() => setShowModal(false)} />}
    </>
  );
}
