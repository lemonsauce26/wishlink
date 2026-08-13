"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type AlertState = { ok: true } | { ok: false; message: string } | null;

export function WishlistVisibilityControl({
  wishlistId,
  initialHidden,
  reportId,
  reportStatus,
}: {
  wishlistId: string;
  initialHidden: boolean;
  reportId: string;
  reportStatus: string;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initialHidden);
  const [confirming, setConfirming] = useState(false);
  const [dimmed, setDimmed] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  async function handleConfirmAction() {
    setConfirming(false);
    setDimmed(true);
    try {
      const res = await fetch(`/api/console/wishlists/${wishlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden_by_admin: !hidden, reportId, reportStatus }),
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

  function handleResultConfirm() {
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
      {/* dimmed overlay (processing 중) */}
      {dimmed && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[200]" />,
        document.body
      )}

      {/* 확인 모달 */}
      {confirming && createPortal(
        <div className="fixed inset-0 z-[201] flex items-center justify-center px-4">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4 text-center">
            <p className="text-3xl">{hidden ? "👁️" : "🚫"}</p>
            <div className="space-y-1">
              <p className="font-semibold text-base">
                {hidden ? "Restore to Explore?" : "Hide from Explore?"}
              </p>
              <p className="text-sm text-muted-foreground">
                {hidden
                  ? "This wishlist will become visible in Explore again."
                  : "This wishlist will no longer appear in Explore."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2 rounded-xl border border-border bg-secondary hover:bg-secondary/60 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`flex-1 py-2 rounded-xl text-white text-sm font-medium transition-colors ${
                  hidden
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {hidden ? "Restore" : "Hide"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 결과 모달 */}
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
              onClick={handleResultConfirm}
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
          onClick={() => setConfirming(true)}
          disabled={dimmed}
          className="text-xs font-medium px-3 py-1 rounded-lg border border-border bg-secondary hover:bg-secondary/60 transition-colors disabled:opacity-50"
        >
          {hidden ? "Restore to Explore" : "Hide from Explore"}
        </button>
      </div>
    </>
  );
}
