"use client";

import { useState } from "react";
import { LoginRequiredModal } from "@/components/explore/login-required-modal";

export function ExploreDetailClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [showModal, setShowModal] = useState(false);

  function handleInteraction() {
    if (!isLoggedIn) {
      setShowModal(true);
    }
    // like → 8-2, copy → 8-4
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={handleInteraction}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
        >
          ❤️ Like
        </button>
        <button
          onClick={handleInteraction}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
        >
          🔖 Copy Wishlist
        </button>
      </div>
      {showModal && <LoginRequiredModal onClose={() => setShowModal(false)} />}
    </>
  );
}
