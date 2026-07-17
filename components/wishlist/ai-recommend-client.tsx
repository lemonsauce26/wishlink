"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/ai-recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlistId }),
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
  }, [wishlistId, retryCount]);

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
          onClick={() => setRetryCount((c) => c + 1)}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {recommendations.map((rec) => (
        <div
          key={rec.name}
          className="rounded-xl border border-border p-5 flex flex-col gap-4"
        >
          <div className="flex-grow">
            <h3 className="font-semibold">✨ {rec.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Find it at</p>
            <div className="flex flex-wrap gap-1.5">
              {STORES.map((store) => (
                <a
                  key={store.name}
                  href={store.url(rec.searchQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-secondary transition-colors"
                >
                  {store.name}
                </a>
              ))}
            </div>
          </div>

          <Link
            href={`/wishlist/${wishlistId}/item/new?title=${encodeURIComponent(rec.name)}`}
            className="block w-full text-center rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            + Add to Wishlist
          </Link>
        </div>
      ))}
    </div>
  );
}
