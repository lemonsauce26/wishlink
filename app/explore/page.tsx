import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppShell } from "@/components/layout/app-shell";
import { ExploreFilterBar } from "@/components/explore/explore-filter-bar";
import { ExploreListClient, type ExploreCardData } from "@/components/explore/explore-list-client";
import Link from "next/link";

const LIMIT = 20;

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
    .range(0, LIMIT - 1)
    .order("updated_at", { ascending: sort === "oldest" });

  if (filter !== "all") query = query.eq("event_type", filter);

  const { data: wishlists } = await query;
  const allWishlists = wishlists ?? [];

  const userIds = [...new Set(allWishlists.map((w) => w.user_id))];
  const wishlistIds = allWishlists.map((w) => w.id);

  const [{ data: owners }, { data: allItems }, { data: allLikes }, { data: allStats }] =
    wishlistIds.length > 0
      ? await Promise.all([
          supabaseAdmin.from("users").select("id, nickname").in("id", userIds),
          supabaseAdmin
            .from("wish_items")
            .select("id, wishlist_id, title, image_url")
            .in("wishlist_id", wishlistIds)
            .order("created_at", { ascending: true }),
          supabaseAdmin.from("wishlist_likes").select("wishlist_id").in("wishlist_id", wishlistIds),
          supabaseAdmin
            .from("wishlist_stats")
            .select("wishlist_id, copy_count, item_save_count")
            .in("wishlist_id", wishlistIds),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const nicknameMap = Object.fromEntries((owners ?? []).map((o) => [o.id, o.nickname ?? ""]));
  const likeCountMap: Record<string, number> = {};
  for (const like of allLikes ?? []) {
    likeCountMap[like.wishlist_id] = (likeCountMap[like.wishlist_id] ?? 0) + 1;
  }
  const statsMap = Object.fromEntries((allStats ?? []).map((s) => [s.wishlist_id, s]));
  const itemCountMap: Record<string, number> = {};
  const previewMap: Record<string, { id: string; title: string; image_url: string | null }[]> = {};
  for (const item of allItems ?? []) {
    itemCountMap[item.wishlist_id] = (itemCountMap[item.wishlist_id] ?? 0) + 1;
    if (!previewMap[item.wishlist_id]) previewMap[item.wishlist_id] = [];
    if (previewMap[item.wishlist_id].length < 9) {
      previewMap[item.wishlist_id].push({ id: item.id, title: item.title, image_url: item.image_url });
    }
  }

  const initialItems: ExploreCardData[] = allWishlists.map((wl) => ({
    id: wl.id,
    title: wl.title,
    event_type: wl.event_type,
    explore_token: wl.explore_token!,
    nickname: nicknameMap[wl.user_id] ?? "",
    itemCount: itemCountMap[wl.id] ?? 0,
    previewItems: previewMap[wl.id] ?? [],
    likeCount: likeCountMap[wl.id] ?? 0,
    saveCount: statsMap[wl.id]?.item_save_count ?? 0,
    copyCount: statsMap[wl.id]?.copy_count ?? 0,
  }));

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

        <ExploreListClient initialItems={initialItems} filter={filter} sort={sort} />
      </main>
    </AppShell>
  );
}
