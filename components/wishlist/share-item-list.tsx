"use client";

import { useState } from "react";
import { ReservationModal } from "./reservation-modal";
import { ReservationListModal } from "./reservation-list-modal";
import { OwnerReservationModal } from "./owner-reservation-modal";

type WishItem = {
  id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string;
  store_name: string | null;
  product_url: string | null;
  priority: "high" | "medium" | "low";
  quantity: number;
  created_at: string;
};

type SortOption = "priority" | "recent" | "price_asc" | "price_desc";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortItems(items: WishItem[], sort: SortOption): WishItem[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case "priority":
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      case "recent":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "price_asc":
        return (a.price ?? 0) - (b.price ?? 0);
      case "price_desc":
        return (b.price ?? 0) - (a.price ?? 0);
    }
  });
}

type Props = {
  items: WishItem[];
  reservationCountMap: Record<string, number>;
  reservationVisibility: "surprise" | "show" | "verified";
  isOwner: boolean;
  myReservationMap: Record<string, string>;
  shareToken: string;
  currentUser: { name: string; email: string } | null;
};

type ActiveModal =
  | { type: "reserve"; itemId: string }
  | { type: "owner"; itemId: string }
  | { type: "list"; itemId: string };

export function ShareItemList({
  items,
  reservationCountMap,
  reservationVisibility,
  isOwner,
  myReservationMap,
  shareToken,
  currentUser,
}: Props) {
  const [sort, setSort] = useState<SortOption>("priority");
  const [counts, setCounts] = useState<Record<string, number>>(reservationCountMap);
  const [myReservations, setMyReservations] = useState<Record<string, string>>(myReservationMap);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const sorted = sortItems(items, sort);

  async function handleMemberCancel(itemId: string, reservationId: string) {
    setCancellingId(itemId);
    const res = await fetch(`/api/reservations/${reservationId}`, { method: "PATCH" });
    const data = await res.json();
    if (data.success) {
      setCounts((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) - 1) }));
      setMyReservations((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
    setCancellingId(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="priority">Sort: Priority</option>
          <option value="recent">Sort: Recently Added</option>
          <option value="price_asc">Sort: Price ↑</option>
          <option value="price_desc">Sort: Price ↓</option>
        </select>
      </div>

      {sorted.map((item) => {
        const count = counts[item.id] ?? 0;
        const myReservationId = myReservations[item.id];
        const availableSlots = item.quantity - count;

        return (
          <div key={item.id} className="rounded-xl border border-border overflow-hidden">
            <div className="flex gap-4 items-start p-4">
              <div className="w-16 h-16 rounded-lg border border-border bg-secondary flex-shrink-0 overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-sm text-muted-foreground">
                  {item.price != null && `$${item.price} ${item.currency ?? "CAD"}`}
                  {item.store_name && item.price != null && " · "}
                  {item.store_name}
                </p>
                {item.product_url && (
                  <a
                    href={item.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                  >
                    View Product
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-secondary/30">
              {isOwner ? (
                <>
                  {count > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ✅ {count}/{item.quantity} reserved
                    </span>
                  )}
                  <div className="flex gap-2 ml-auto">
                    {reservationVisibility !== "surprise" && count > 0 && (
                      <button
                        onClick={() => setActiveModal({ type: "list", itemId: item.id })}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        View reservations
                      </button>
                    )}
                    <button
                      onClick={() => setActiveModal({ type: "owner", itemId: item.id })}
                      disabled={availableSlots <= 0}
                      className="text-xs font-medium hover:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + Reserve for someone
                    </button>
                  </div>
                </>
              ) : myReservationId ? (
                <>
                  <span className="text-xs text-muted-foreground">✅ I&apos;m getting this!</span>
                  <button
                    onClick={() => handleMemberCancel(item.id, myReservationId)}
                    disabled={cancellingId === item.id}
                    className="ml-auto text-xs text-destructive hover:opacity-70 transition-opacity disabled:opacity-40"
                  >
                    {cancellingId === item.id ? "…" : "Cancel reservation"}
                  </button>
                </>
              ) : availableSlots > 0 ? (
                <button
                  onClick={() => setActiveModal({ type: "reserve", itemId: item.id })}
                  className="ml-auto rounded-lg bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  🎁 I&apos;ll Get This!
                </button>
              ) : (
                <button
                  disabled
                  className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm font-medium opacity-40 cursor-not-allowed"
                >
                  Already taken!
                </button>
              )}
            </div>
          </div>
        );
      })}

      {activeModal?.type === "reserve" && (
        <ReservationModal
          wishItemId={activeModal.itemId}
          reservationVisibility={reservationVisibility}
          shareToken={shareToken}
          currentUser={currentUser}
          onClose={() => setActiveModal(null)}
          onSuccess={(reservationId) => {
            const itemId = activeModal.itemId;
            setCounts((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
            if (currentUser) {
              setMyReservations((prev) => ({ ...prev, [itemId]: reservationId }));
            }
            setActiveModal(null);
          }}
        />
      )}

      {activeModal?.type === "owner" && (
        <OwnerReservationModal
          wishItemId={activeModal.itemId}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            const itemId = activeModal.itemId;
            setCounts((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
            setActiveModal(null);
          }}
        />
      )}

      {activeModal?.type === "list" && (
        <ReservationListModal
          wishItemId={activeModal.itemId}
          onClose={() => setActiveModal(null)}
          onCancelled={() => {
            const itemId = activeModal.itemId;
            setCounts((prev) => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) - 1) }));
          }}
        />
      )}
    </div>
  );
}
