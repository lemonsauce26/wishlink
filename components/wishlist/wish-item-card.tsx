"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, User } from "lucide-react";
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
  reservationVisibility?: string;
};

export function WishItemCard({ item, isOwner = false, reservationCount: initialClaimCount = 0, reservationVisibility }: Props) {
  const priority = PRIORITY_CONFIG[item.priority];
  const [reservationCount, setReservationCount] = useState(initialClaimCount);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);

  const availableSlots = item.quantity - reservationCount;

  const handleViewReservations = () => {
    if (reservationVisibility === "surprise") {
      setShowSurpriseModal(true);
    } else {
      setShowListModal(true);
    }
  };

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
        <div className="flex items-center gap-3 px-4 py-2 border-t border-border bg-secondary/30 flex-wrap">
          {reservationCount > 0 ? (
            <button
              onClick={handleViewReservations}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />{reservationCount}/{item.quantity} reserved
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600">
                <User className="w-2.5 h-2.5 text-white" />
              </span>
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">
              {item.quantity} slot{item.quantity > 1 ? "s" : ""}
            </span>
          )}
          <div className="flex gap-2 ml-auto flex-shrink-0">
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

      {showSurpriseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowSurpriseModal(false)}>
          <div className="bg-background rounded-2xl p-6 max-w-xs w-full mx-4 space-y-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <p className="text-2xl">🎁</p>
            <p className="font-semibold">No peeking!</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You set this wishlist to <strong>Surprise Me</strong>, so who reserved what stays a secret — even from you. Sit back and enjoy the surprise!
            </p>
            <button
              onClick={() => setShowSurpriseModal(false)}
              className="w-full mt-2 rounded-xl bg-emerald-600 text-white text-sm font-medium py-2 hover:bg-emerald-700 transition-colors"
            >
              Got it 🎉
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
