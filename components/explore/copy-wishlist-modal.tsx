"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

type Step = "confirm" | "copying" | "done" | "error";

export function CopyWishlistModal({
  wishlistId,
  wishlistTitle,
  onClose,
  onCopied,
}: {
  wishlistId: string;
  wishlistTitle: string;
  onClose: () => void;
  onCopied: () => void;
}) {
  const [step, setStep] = useState<Step>("confirm");
  const [newId, setNewId] = useState<string | null>(null);

  async function handleCopy() {
    setStep("copying");
    try {
      const res = await fetch(`/api/wishlists/${wishlistId}/copy`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewId(data.id);
      setStep("done");
      onCopied();
    } catch {
      setStep("error");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && step !== "copying" && onClose()}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full sm:max-w-sm bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-xl p-5 space-y-4">
        {step === "confirm" && (
          <>
            <div className="space-y-1">
              <h2 className="font-semibold text-base">Copy this wishlist?</h2>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{wishlistTitle}</span> will be copied
                to your account as a new public wishlist.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCopy}
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-sm font-medium transition-colors"
              >
                Copy
              </button>
            </div>
          </>
        )}

        {step === "copying" && (
          <div className="py-6 text-center text-sm text-muted-foreground">Copying...</div>
        )}

        {step === "done" && (
          <>
            <div className="space-y-1">
              <h2 className="font-semibold text-base">Copied!</h2>
              <p className="text-sm text-muted-foreground">
                The wishlist has been added to your account.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Close
              </button>
              {newId && (
                <Link
                  href={`/wishlist/${newId}`}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-sm font-medium transition-colors text-center"
                  onClick={onClose}
                >
                  View →
                </Link>
              )}
            </div>
          </>
        )}

        {step === "error" && (
          <>
            <div className="space-y-1">
              <h2 className="font-semibold text-base">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">Please try again.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
