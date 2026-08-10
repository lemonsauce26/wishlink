"use client";

import { RefObject } from "react";
import { Loader2 } from "lucide-react";

export function ScrollSentinel({
  sentinelRef,
  loading,
}: {
  sentinelRef: RefObject<HTMLDivElement>;
  loading: boolean;
}) {
  return (
    <div ref={sentinelRef} className="flex justify-center py-6">
      {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
    </div>
  );
}
