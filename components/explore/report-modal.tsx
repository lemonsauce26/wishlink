"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

const REPORT_REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Offensive or hateful content",
  "Other",
];

type AlertState = { variant: "success" | "error"; code?: number };

export function ReportModal({
  wishlistId,
  onClose,
  onSubmitted,
}: {
  wishlistId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [selected, setSelected] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState | null>(null);

  const isOther = selected === "Other";
  const canSubmit = selected && (!isOther || comment.trim().length > 0);

  async function handleSubmit() {
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/wishlists/${wishlistId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: selected, comment: isOther ? comment.trim() : null }),
      });
      setAlert(res.ok ? { variant: "success" } : { variant: "error", code: res.status });
    } finally {
      setLoading(false);
    }
  }

  if (alert) {
    return createPortal(
      <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-6">
        <div className="bg-background rounded-2xl p-6 w-full max-w-xs shadow-xl space-y-4 text-center">
          <p className="text-3xl">{alert.variant === "success" ? "✅" : "⚠️"}</p>
          <div className="space-y-1">
            <p className="font-semibold">
              {alert.variant === "success" ? "Report submitted!" : "Submission failed"}
            </p>
            <p className="text-sm text-muted-foreground">
              {alert.variant === "success"
                ? <>Thanks for letting us know.<br />We&apos;ll review it shortly.</>
                : `Something went wrong. Please try again.${alert.code ? ` (${alert.code})` : ""}`}
            </p>
          </div>
          <button
            onClick={alert.variant === "success" ? onSubmitted : () => setAlert(null)}
            className="w-full rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl p-5 w-full max-w-xs shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-semibold text-sm">Why are you reporting this?</p>

        <div className="space-y-1.5">
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border cursor-pointer hover:bg-secondary transition-colors has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 dark:has-[:checked]:bg-emerald-950/20"
            >
              <input
                type="radio"
                name="reason"
                value={reason}
                checked={selected === reason}
                onChange={() => { setSelected(reason); setComment(""); }}
                className="accent-emerald-600"
              />
              <span className="text-sm">{reason}</span>
            </label>
          ))}
          {isOther && (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Please describe the issue…"
              rows={3}
              maxLength={500}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 placeholder:text-muted-foreground"
            />
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
