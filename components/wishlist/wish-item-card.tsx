"use client";

import Link from "next/link";
import { useState } from "react";
import { OwnerReservationModal } from "./owner-reservation-modal";
import { ReservationListModal } from "./reservation-list-modal";

const PRIORITY_CONFIG = {
  high: { dot: "bg-yellow-400", label: "High" },
  medium: { dot: "bg-blue-400", label: "Medium" },
  low: { dot: "bg-muted-foreground/30", label: "Low" },
};

type WishItem = {
  id: string;
  wishlist_id: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string;
  store_name: string | null;
  priority: "high" | "medium" | "low";
  quantity: number;
};

type Props = {
  item: WishItem;
  isOwner?: boolean;
  reservationCount?: number;
};

export function WishItemCard({ item, isOwner = false, reservationCount: initialClaimCount = 0 }: Props) {
  const priority = PRIORITY_CONFIG[item.priority];
  const [reservationCount, setReservationCount] = useState(initialClaimCount);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  const availableSlots = item.quantity - reservationCount;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Link
        href={`/wishlist/${item.wishlist_id}/item/${item.id}`}
        className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="w-16 h-16 rounded-lg border border-border bg-secondary flex-shrink-0 overflow-hidden">
          {item.image_url ? (
            <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {item.price != null && (
              <span className="text-sm text-muted-foreground">
                ${item.price.toFixed(2)} {item.currency}
              </span>
            )}
            {item.store_name && (
              <span className="text-xs text-muted-foreground">· {item.store_name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
          <span className="text-xs text-muted-foreground">{priority.label}</span>
        </div>
      </Link>

      {isOwner && (
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-secondary/30">
          {reservationCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              ✅ {reservationCount}/{item.quantity} reserved
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {item.quantity} slot{item.quantity > 1 ? "s" : ""}
            </span>
          )}
          <div className="flex gap-2 ml-auto">
            {reservationCount > 0 && (
              <button
                onClick={() => setShowListModal(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View reservations
              </button>
            )}
            <button
              onClick={() => setShowReservationModal(true)}
              disabled={availableSlots <= 0}
              className="text-xs font-medium hover:opacity-70 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Reserve for someone
            </button>
          </div>
        </div>
      )}

      {showReservationModal && (
        <OwnerReservationModal
          wishItemId={item.id}
          onClose={() => setShowReservationModal(false)}
          onSuccess={() => setReservationCount((c) => c + 1)}
        />
      )}
      {showListModal && (
        <ReservationListModal
          wishItemId={item.id}
          onClose={() => setShowListModal(false)}
          onCancelled={() => setReservationCount((c) => Math.max(0, c - 1))}
        />
      )}
    </div>
  );
}
