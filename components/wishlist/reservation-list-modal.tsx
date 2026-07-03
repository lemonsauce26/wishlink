"use client";

import { useState, useEffect } from "react";

type Reservation = {
  id: string;
  reserver_name: string;
  reserver_email: string | null;
  reserver_note: string | null;
};

type Props = {
  wishItemId: string;
  onClose: () => void;
  onCancelled: () => void;
};

export function ReservationListModal({ wishItemId, onClose, onCancelled }: Props) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reservations/item/${wishItemId}`)
      .then((r) => r.json())
      .then((data) => setReservations(data.reservations ?? []))
      .catch((err) => {
        console.error("[ReservationListModal] fetch failed", wishItemId, err);
        setLoadError("Failed to load reservations. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [wishItemId]);

  async function handleCancel(reservationId: string) {
    setCancellingId(reservationId);
    setCancelError(null);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, { method: "PATCH" });
      const data = await res.json();
      if (data.success) {
        setReservations((prev) => prev.filter((r) => r.id !== reservationId));
        onCancelled();
      } else {
        console.error("[ReservationListModal] cancel failed", reservationId, data);
        setCancelError("Failed to cancel reservation. Please try again.");
      }
    } catch (err) {
      console.error("[ReservationListModal] cancel failed", reservationId, err);
      setCancelError("Failed to cancel reservation. Please try again.");
    }
    setCancellingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
        <h3 className="font-semibold">Reservations</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : reservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reservations yet.</p>
        ) : (
          <ul className="space-y-3 max-h-72 overflow-y-auto">
            {reservations.map((reservation) => (
              <li key={reservation.id} className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium">{reservation.reserver_name}</p>
                  {reservation.reserver_email && (
                    <p className="text-xs text-muted-foreground truncate">{reservation.reserver_email}</p>
                  )}
                  {reservation.reserver_note && (
                    <p className="text-xs text-muted-foreground italic">&ldquo;{reservation.reserver_note}&rdquo;</p>
                  )}
                </div>
                <button
                  onClick={() => handleCancel(reservation.id)}
                  disabled={cancellingId === reservation.id}
                  className="text-xs text-destructive hover:opacity-70 transition-opacity disabled:opacity-40 flex-shrink-0 mt-0.5"
                >
                  {cancellingId === reservation.id ? "…" : "Cancel"}
                </button>
              </li>
            ))}
          </ul>
        )}
        {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
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
