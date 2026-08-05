"use client";

import { useState } from "react";
import { LoginRequiredModal } from "@/components/explore/login-required-modal";

interface FollowButtonProps {
  nickname: string;
  isLoggedIn: boolean;
  initialFollowing: boolean;
  initialCount: number;
}

export function FollowButton({ nickname, isLoggedIn, initialFollowing, initialCount }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    (e.currentTarget as HTMLButtonElement).blur();

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const prev = { following, count };
    setFollowing(!following);
    setCount(following ? count - 1 : count + 1);
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(nickname)}/follow`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFollowing(data.following);
      setCount(data.count);
    } catch {
      setFollowing(prev.following);
      setCount(prev.count);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
          following
            ? "border border-border text-muted-foreground hover:border-destructive hover:text-destructive"
            : "bg-emerald-600 text-white hover:bg-emerald-700"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
      {count > 0 && (
        <span className="text-sm text-muted-foreground">{count} followers</span>
      )}
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
}
