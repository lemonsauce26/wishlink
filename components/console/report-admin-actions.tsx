"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "resolved", label: "Resolved" },
];

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
};

type HistoryItem = {
  id: string;
  comment: string | null;
  status: string;
  created_at: string;
  adminDisplayName: string;
  adminEmail: string | null;
};

type AlertState = { ok: true } | { ok: false; message: string } | null;

export function ReportAdminActions({
  reportId,
  initialStatus,
  history,
}: {
  reportId: string;
  initialStatus: string;
  history: HistoryItem[];
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [dimmed, setDimmed] = useState(false);
  const [alert, setAlert] = useState<AlertState>(null);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  async function handleSave() {
    setDimmed(true);
    try {
      const res = await fetch(`/api/console/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment, status }),
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
      setComment("");
      router.refresh();
    }
  }

  return (
    <>
      {dimmed && createPortal(
        <div className="fixed inset-0 bg-black/40 z-[200]" />,
        document.body
      )}

      <section className="rounded-xl border border-border divide-y divide-border">
        <div className="px-5 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Admin</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Comment</p>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment on this report..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Status</p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={dimmed}
              className="text-sm font-medium px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
            >
              {dimmed && !alert ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {history.length > 0 && (
          <div className="divide-y divide-border">
            {[...history].reverse().map((entry) => (
              <div key={entry.id} className="px-5 py-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[entry.status] ?? statusColor.pending}`}
                  >
                    {entry.status}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                    {fmt(entry.created_at)}
                  </span>
                </div>
                {entry.comment && (
                  <p className="text-sm text-muted-foreground">{entry.comment}</p>
                )}
                <p className="text-xs text-muted-foreground/60">
                  by {entry.adminDisplayName}{entry.adminEmail && ` (${entry.adminEmail})`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* result modal */}
      {alert && createPortal(
        <div className="fixed inset-0 z-[201] flex items-center justify-center px-4">
          <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-xs p-6 space-y-4 text-center">
            <p className="text-3xl">{alert.ok ? "✅" : "❌"}</p>
            <div className="space-y-1">
              <p className="font-semibold text-base">
                {alert.ok ? "Saved successfully" : "Save failed"}
              </p>
              <p className="text-sm text-muted-foreground">
                {alert.ok
                  ? "The report has been updated."
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
    </>
  );
}
