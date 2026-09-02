"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, ExternalLink } from "lucide-react";

type Recommendation = {
  name: string;
  description: string;
  searchQuery: string;
};

const STORES = [
  { name: "Amazon.ca", url: (q: string) => `https://www.amazon.ca/s?k=${encodeURIComponent(q)}` },
  { name: "Walmart",   url: (q: string) => `https://www.walmart.ca/search?q=${encodeURIComponent(q)}` },
  { name: "Canadian Tire", url: (q: string) => `https://www.canadiantire.ca/en/search-results.html?q=${encodeURIComponent(q)}` },
  { name: "Best Buy",  url: (q: string) => `https://www.bestbuy.ca/en-ca/search?search=${encodeURIComponent(q)}` },
  { name: "Indigo",    url: (q: string) => `https://www.indigo.ca/search?q=${encodeURIComponent(q)}` },
];

type Props = {
  wishlistId: string;
  wishlistTitle: string;
};

export function AiRecommendClient({ wishlistId, wishlistTitle }: Props) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/ai-recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlistId, excludedItems: excluded }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        } else {
          setError("Couldn't generate recommendations. Please try again.");
        }
      })
      .catch(() => setError("Request failed. Please try again."))
      .finally(() => setLoading(false));
  // excluded는 의도적으로 제외 — retryCount 변경 시에만 재fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistId, retryCount]);

  function handleExclude(name: string) {
    setExcluded((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function handleRefresh() {
    setRetryCount((c) => c + 1);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-foreground animate-spin" />
        <p className="text-sm">Generating ideas for <span className="font-medium text-foreground">{wishlistTitle}</span>…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-2">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={handleRefresh}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
        {recommendations.map((rec) => (
          <div
            key={rec.name}
            className="rounded-xl border border-border p-5 flex flex-col gap-4 h-full"
          >
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">✨ {rec.name}</h3>
              <p className="text-sm text-muted-foreground">{rec.description}</p>
            </div>

            <div className="rounded-lg bg-secondary/60 px-3 py-2.5 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Go search it on</p>
              <div className="flex flex-wrap gap-1.5">
                {STORES.map((store) => (
                  <a
                    key={store.name}
                    href={store.url(rec.searchQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-secondary transition-colors"
                  >
                    {store.name}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/wishlist/${wishlistId}/item/new?title=${encodeURIComponent(rec.name)}`}
                className="flex-1 flex items-center justify-center rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                + Quick Add
              </Link>
              <button
                onClick={() => handleExclude(rec.name)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  excluded.includes(rec.name)
                    ? "border-rose-400 bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400"
                    : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                }`}
              >
                Don't recommend for this wishlist
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-2">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh ideas
        </button>
      </div>
    </div>
  );
}
