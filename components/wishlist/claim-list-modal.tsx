"use client";

import { useState, useEffect } from "react";

type Claim = {
  id: string;
  claimer_name: string;
  claimer_email: string | null;
  claimer_note: string | null;
};

type Props = {
  wishItemId: string;
  onClose: () => void;
  onCancelled: () => void;
};

export function ClaimListModal({ wishItemId, onClose, onCancelled }: Props) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/claims/item/${wishItemId}`)
      .then((r) => r.json())
      .then((data) => setClaims(data.claims ?? []))
      .finally(() => setLoading(false));
  }, [wishItemId]);

  async function handleCancel(claimId: string) {
    setCancellingId(claimId);
    const res = await fetch(`/api/claims/${claimId}`, { method: "PATCH" });
    const data = await res.json();
    if (data.success) {
      setClaims((prev) => prev.filter((c) => c.id !== claimId));
      onCancelled();
    }
    setCancellingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <h3 className="font-semibold">🎁 Who claimed this</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : claims.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active claims.</p>
        ) : (
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {claims.map((claim) => (
              <li key={claim.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium">{claim.claimer_name}</p>
                  {claim.claimer_email && (
                    <p className="text-xs text-muted-foreground truncate">{claim.claimer_email}</p>
                  )}
                  {claim.claimer_note && (
                    <p className="text-xs text-muted-foreground italic">"{claim.claimer_note}"</p>
                  )}
                </div>
                <button
                  onClick={() => handleCancel(claim.id)}
                  disabled={cancellingId === claim.id}
                  className="text-xs text-destructive hover:opacity-70 transition-opacity disabled:opacity-40 flex-shrink-0 mt-0.5"
                >
                  {cancellingId === claim.id ? "…" : "Cancel"}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={onClose}
          className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
