"use client";

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export function LoginRequiredModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl p-6 w-full max-w-xs shadow-xl space-y-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-2xl">🔒</p>
        <p className="font-semibold text-foreground">Login required</p>
        <p className="text-sm text-muted-foreground">Would you like to sign in?</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => router.push("/auth/login")}
            className="flex-1 rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
