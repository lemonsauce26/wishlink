"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EVENT_INFOS } from "@/lib/constants/event-infos";

const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "active", label: "Recently Active" },
];

export function ExploreFilterBar({
  currentFilter,
  currentSort,
}: {
  currentFilter: string;
  currentSort: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      params.set(key, value);
    }
    router.push(`/explore?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => navigate({ filter: "all" })}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
            currentFilter === "all"
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:bg-secondary"
          }`}
        >
          All
        </button>
        {EVENT_INFOS.map((ev) => (
          <button
            key={ev.value}
            onClick={() => navigate({ filter: ev.value })}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border whitespace-nowrap ${
              currentFilter === ev.value
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {ev.emoji} {ev.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <select
          value={currentSort}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
