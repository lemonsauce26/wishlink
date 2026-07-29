import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppShell } from "@/components/layout/app-shell";
import { ExploreCard } from "@/components/explore/explore-card";
import { ExploreFilterBar } from "@/components/explore/explore-filter-bar";
import Link from "next/link";

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sort?: string }>;
}) {
  const { filter = "all", sort = "latest" } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabaseAdmin
    .from("wishlists")
    .select("id, title, event_type, user_id, explore_token, updated_at")
    .not("explore_token", "is", null)
    .order("updated_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("event_type", filter);
  }

  const { data: wishlists } = await query;
  const allWishlists = wishlists ?? [];

  const userIds = [...new Set(allWishlists.map((w) => w.user_id))];
  const { data: owners } =
    userIds.length > 0
      ? await supabaseAdmin
          .from("users")
          .select("id, nickname")
          .in("id", userIds)
      : { data: [] as { id: string; nickname: string | null }[] };

  const nicknameMap = Object.fromEntries(
    (owners ?? []).map((o) => [o.id, o.nickname ?? ""])
  );

  const wishlistIds = allWishlists.map((w) => w.id);
  const { data: allItems } =
    wishlistIds.length > 0
      ? await supabaseAdmin
          .from("wish_items")
          .select("id, wishlist_id, title, image_url")
          .in("wishlist_id", wishlistIds)
          .order("created_at", { ascending: true })
      : {
          data: [] as {
            id: string;
            wishlist_id: string;
            title: string;
            image_url: string | null;
          }[],
        };

  const itemCountMap: Record<string, number> = {};
  const previewMap: Record<
    string,
    { id: string; title: string; image_url: string | null }[]
  > = {};

  for (const item of allItems ?? []) {
    itemCountMap[item.wishlist_id] = (itemCountMap[item.wishlist_id] ?? 0) + 1;
    if (!previewMap[item.wishlist_id]) previewMap[item.wishlist_id] = [];
    if (previewMap[item.wishlist_id].length < 9) {
      previewMap[item.wishlist_id].push({
        id: item.id,
        title: item.title,
        image_url: item.image_url,
      });
    }
  }

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Explore</h1>
          {user ? (
            <Link
              href="/wishlists"
              className="text-sm text-emerald-600 font-medium hover:underline"
            >
              Post your wishlist →
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in to post →
            </Link>
          )}
        </div>

        <Suspense>
          <ExploreFilterBar currentFilter={filter} currentSort={sort} />
        </Suspense>

        {allWishlists.length === 0 ? (
          <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">🔍</p>
            <p className="font-medium">No wishlists yet</p>
            <p className="text-sm">Be the first to share your wishlist!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allWishlists.map((wl) => (
              <ExploreCard
                key={wl.id}
                wishlist={{
                  title: wl.title,
                  event_type: wl.event_type,
                  explore_token: wl.explore_token!,
                }}
                nickname={nicknameMap[wl.user_id] ?? ""}
                itemCount={itemCountMap[wl.id] ?? 0}
                previewItems={previewMap[wl.id] ?? []}
              />
            ))}
          </div>
        )}
      </main>
    </AppShell>
  );
}
