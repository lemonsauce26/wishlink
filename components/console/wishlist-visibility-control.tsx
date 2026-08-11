"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type AlertState = { ok: true } | { ok: false; message: string } | null;

export function WishlistVisibilityControl({
  wishlistId,
  initialHidden,
}: {
  wishlistId: string;
  initialHidden: boolean;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initialHidden);
  const [dimmed, setDimmed] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  async function handleToggle() {
    setDimmed(true);
    try {
      const res = await fetch(`/api/console/wishlists/${wishlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden_by_admin: !hidden }),
      });
      if (res.ok) {
        setAlert({ ok: true });
      } else {
        const body = await res.json().catch(() => ({}));
        setAlert({ ok: false, message: body.error ?? `Error ${res.status}` });
      }
    } catch {
      setAlert({ ok: false, message: "Network error. Please try again." });
    }
  }

  function handleConfirm() {
    const wasOk = alert?.ok;
    setAlert(null);
    setDimmed(false);
    if (wasOk) {
      setHidden((prev) => !prev);
      router.refresh();
    }
  }

  return (
    <>
      {dimmed && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[200]" />,
        document.body
      )}

      {alert && createPortal(
        <div className="fixed inset-0 z-[201] flex items-center justify-center px-4">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4 text-center">
            <p className="text-3xl">{alert.ok ? "✅" : "❌"}</p>
            <div className="space-y-1">
              <p className="font-semibold text-base">
                {alert.ok
                  ? hidden ? "Restored to Explore" : "Hidden from Explore"
                  : "Failed"}
              </p>
              <p className="text-sm text-muted-foreground">
                {alert.ok
                  ? hidden
                    ? "The wishlist is now visible in Explore."
                    : "The wishlist has been hidden from Explore."
                  : alert.message}
              </p>
            </div>
            <button
              onClick={handleConfirm}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>,
        document.body
      )}

      <div className="px-5 py-4 flex items-center gap-3">
        <span
          className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
            hidden
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
          }`}
        >
          {hidden ? "Hidden by Admin" : "Visible"}
        </span>
        <button
          onClick={handleToggle}
          disabled={dimmed}
          className="text-xs font-medium px-3 py-1 rounded-lg border border-border bg-secondary hover:bg-secondary/60 transition-colors disabled:opacity-50"
        >
          {hidden ? "Restore to Explore" : "Hide from Explore"}
        </button>
      </div>
    </>
  );
}
