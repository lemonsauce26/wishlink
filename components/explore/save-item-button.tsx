"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { SaveItemModal } from "@/components/explore/save-item-modal";
import { LoginRequiredModal } from "@/components/explore/login-required-modal";

export function SaveItemButton({
  itemId,
  isLoggedIn,
}: {
  itemId: string;
  isLoggedIn: boolean;
}) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLButtonElement).blur();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setShowSaveModal(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="shrink-0 rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        title="Copy item"
      >
        <FolderPlus className="w-4 h-4" />
      </button>

      {showSaveModal && (
        <SaveItemModal
          itemId={itemId}
          onClose={() => setShowSaveModal(false)}
        />
      )}
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
}
