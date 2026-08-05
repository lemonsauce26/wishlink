"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { LoginRequiredModal } from "@/components/explore/login-required-modal";

export function LikeItemButton({
  itemId,
  isLoggedIn,
  initialLiked,
}: {
  itemId: string;
  isLoggedIn: boolean;
  initialLiked: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    (e.currentTarget as HTMLButtonElement).blur();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (loading) return;

    const prev = liked;
    setLiked(!liked);
    setLoading(true);
    try {
      const res = await fetch(`/api/wish-items/${itemId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
    } catch {
      setLiked(prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`shrink-0 rounded-lg border p-2 transition-colors disabled:opacity-40 ${
          liked
            ? "border-rose-300 bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:border-rose-800"
            : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
        }`}
        title={liked ? "Unlike" : "Like"}
      >
        <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
      </button>
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
}
