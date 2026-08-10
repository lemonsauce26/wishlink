"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle } from "lucide-react";

export type ToastData = {
  variant: "success" | "error";
  message: string;
  code?: number;
};

export function Toast({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => setVisible(false), 3000);
    const remove = setTimeout(onDismiss, 3500);
    return () => { cancelAnimationFrame(show); clearTimeout(hide); clearTimeout(remove); };
  }, [onDismiss]);

  const isSuccess = data.variant === "success";

  return createPortal(
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } ${
        isSuccess
          ? "bg-background border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400"
          : "bg-background border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-400"
      }`}
    >
      {isSuccess
        ? <CheckCircle className="w-4 h-4 shrink-0" />
        : <XCircle className="w-4 h-4 shrink-0" />
      }
      <span>{data.message}</span>
      {data.code && (
        <span className="text-xs opacity-60 font-mono">[{data.code}]</span>
      )}
    </div>,
    document.body
  );
}
