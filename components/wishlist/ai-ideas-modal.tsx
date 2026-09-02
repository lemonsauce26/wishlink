"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { EVENT_INFOS } from "@/lib/constants/event-infos";

type Props = {
  wishlistId: string;
  eventType: string;
  initialAgeGroup: string;
  initialGender: string;
  onClose: () => void;
};

export function AiIdeasModal({ wishlistId, eventType, initialAgeGroup, initialGender, onClose }: Props) {
  const router = useRouter();
  const [ageGroup, setAgeGroup] = useState(initialAgeGroup);
  const [gender, setGender] = useState(initialGender);
  const [selectedEventType, setSelectedEventType] = useState(eventType);

  function handleStart() {
    const params = new URLSearchParams();
    if (ageGroup) params.set("ageGroup", ageGroup);
    if (gender) params.set("gender", gender);
    if (selectedEventType) params.set("eventType", selectedEventType);
    router.push(`/wishlist/${wishlistId}/recommend?${params.toString()}`);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-background rounded-2xl border border-border shadow-xl p-6 w-full max-w-sm mx-4 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <h2 className="text-base font-semibold">✨ AI Gift Ideas</h2>
          <p className="text-sm text-muted-foreground">
            Adjust the options below to get more personalized recommendations.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Event type</label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {EVENT_INFOS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.emoji} {e.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Age group</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select</option>
                <option value="10">10s</option>
                <option value="20">20s</option>
                <option value="30">30s</option>
                <option value="40">40s</option>
                <option value="50">50s</option>
                <option value="60+">60s+</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select</option>
                <option value="m">Male</option>
                <option value="f">Female</option>
                <option value="o">Other</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Changes here are only used for this recommendation and won't update your profile.
          </p>
        </div>

        <button
          onClick={handleStart}
          className="w-full rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          Get AI Ideas
        </button>
      </div>
    </div>,
    document.body
  );
}
