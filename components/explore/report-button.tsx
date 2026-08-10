"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { ReportModal } from "@/components/explore/report-modal";
import { LoginRequiredModal } from "@/components/explore/login-required-modal";

export function ReportButton({
  wishlistId,
  isLoggedIn,
  initialReported,
}: {
  wishlistId: string;
  isLoggedIn: boolean;
  initialReported: boolean;
}) {
  const [reported, setReported] = useState(initialReported);
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  function handleClick() {
    if (!isLoggedIn) { setShowLoginModal(true); return; }
    if (reported) return;
    setShowModal(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        title={reported ? "Reported" : "Report this wishlist"}
        className={`flex items-center gap-1.5 text-xs transition-colors ${
          reported
            ? "text-rose-400 cursor-default"
            : "text-muted-foreground hover:text-rose-500"
        }`}
      >
        <Flag className={`w-3.5 h-3.5 ${reported ? "fill-current" : ""}`} />
        {reported ? "Reported" : "Report"}
      </button>

      {showModal && (
        <ReportModal
          wishlistId={wishlistId}
          onClose={() => setShowModal(false)}
          onSubmitted={() => { setShowModal(false); setReported(true); }}
        />
      )}
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
}
