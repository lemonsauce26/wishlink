"use client";

import { useState } from "react";

type Props = {
  wishItemId: string;
  reservationVisibility: "surprise" | "show" | "verified";
  shareToken: string;
  currentUser: { name: string; email: string } | null;
  onClose: () => void;
  onSuccess: (reservationId: string) => void;
};

export function ReservationModal({
  wishItemId,
  reservationVisibility,
  shareToken,
  currentUser,
  onClose,
  onSuccess,
}: Props) {
  const isGuest = !currentUser;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  if (succeeded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4 text-center">
          <p className="text-3xl">🎉</p>
          <h3 className="font-semibold">You&apos;re all set!</h3>
          <p className="text-sm text-muted-foreground">Your reservation has been confirmed.</p>
          {isGuest && (
            <p className="text-sm text-muted-foreground">We&apos;ve sent your reservation details to your email!</p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  // Verified Only + guest → login prompt
  if (reservationVisibility === "verified" && isGuest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
          <p className="text-2xl text-center">🔐</p>
          <h3 className="font-semibold text-center">Sign in required</h3>
          <p className="text-sm text-muted-foreground text-center">
            Only signed-in members can reserve items on this wishlist.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <a
              href={`/auth/login?next=/share/${shareToken}`}
              className="flex-1 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors text-center"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  const visibilityMessage =
    reservationVisibility === "surprise"
      ? "The owner won't see who's getting this — unless they change their wishlist settings."
      : "The wishlist owner will see your name";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reservations/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishItemId,
          name: isGuest ? name.trim() : currentUser!.name,
          email: isGuest ? email.trim() : currentUser!.email,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSucceeded(true);
        onSuccess(data.id);
      } else if (data.error === "No slots available") {
        setError("All slots are already reserved.");
      } else {
        console.error("[ReservationModal] submit failed", wishItemId, data);
        setError("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("[ReservationModal] submit failed", wishItemId, err);
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <h3 className="font-semibold">Would you like to reserve this item?</h3>

        {reservationVisibility !== "surprise" && (
          <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
            {reservationVisibility === "show"
              ? "Heads up — the wishlist owner will see your name"
              : "The wishlist owner will see your name"}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isGuest ? (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoFocus
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground">We&apos;ll send a cancellation link here.</p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm">
              <p className="font-medium">{currentUser!.name}</p>
              <p className="text-muted-foreground text-xs">{currentUser!.email}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Note <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Happy to wrap it too!"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {reservationVisibility === "surprise" && (
            <p className="text-xs text-muted-foreground">{visibilityMessage}</p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (isGuest && (!name.trim() || !email.trim()))}
              className="flex-1 rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Reserving…" : "🎁 I'll Get This!"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
