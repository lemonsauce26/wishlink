import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppShell } from "@/components/layout/app-shell";
import { ExploreFilterBar } from "@/components/explore/explore-filter-bar";
import { ExploreListClient, type ExploreCardData } from "@/components/explore/explore-list-client";
import { ExploreSearchBar } from "@/components/explore/explore-search-bar";
import Link from "next/link";

const LIMIT = 20;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; sort?: string; q?: string }>;
}) {
  const { filter = "all", sort = "latest", q } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 검색 모드
  if (q?.trim()) {
    const keyword = q.trim();

    const { data: matchedUsers } = await supabaseAdmin
      .from("users")
      .select("id, nickname, avatar_url")
      .ilike("nickname", `%${keyword}%`)
      .limit(20);

    const userIds = (matchedUsers ?? []).map((u) => u.id);

    const { data: exploreWishlists } = userIds.length > 0
      ? await supabaseAdmin
          .from("wishlists")
          .select("user_id")
          .in("user_id", userIds)
          .not("explore_token", "is", null)
          .eq("hidden_by_admin", false)
      : { data: [] as { user_id: string }[] };

    const wishlistCountMap: Record<string, number> = {};
    for (const w of exploreWishlists ?? []) {
      wishlistCountMap[w.user_id] = (wishlistCountMap[w.user_id] ?? 0) + 1;
    }

    const peopleResults = (matchedUsers ?? []).filter((u) => (wishlistCountMap[u.id] ?? 0) > 0);

    return (
      <AppShell>
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Explore</h1>
            {user ? (
              <Link href="/wishlists" className="text-sm text-emerald-600 font-medium hover:underline">
                Post your wishlist →
              </Link>
            ) : (
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Sign in to post →
              </Link>
            )}
          </div>

          <ExploreSearchBar defaultValue={keyword} />

          {peopleResults.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-muted-foreground text-sm">No results found for &ldquo;{keyword}&rdquo;</p>
            </div>
          ) : (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">People</h2>
              <div className="space-y-2">
                {peopleResults.map((u) => (
                  <Link
                    key={u.id}
                    href={`/explore/user/${encodeURIComponent(u.nickname ?? u.id)}`}
                    className="flex items-center gap-3 rounded-xl p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary shrink-0">
                      {u.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatar_url} alt={u.nickname ?? ""} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                          {(u.nickname ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">@{u.nickname}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {wishlistCountMap[u.id]} wishlist{wishlistCountMap[u.id] !== 1 ? "s" : ""} on Explore
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </AppShell>
    );
  }

  let query = supabaseAdmin
    .from("wishlists")
    .select("id, title, event_type, user_id, explore_token, updated_at")
    .not("explore_token", "is", null)
    .eq("hidden_by_admin", false)
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

        <ExploreSearchBar />

        <Suspense>
          <ExploreFilterBar currentFilter={filter} currentSort={sort} />
        </Suspense>

        <ExploreListClient initialItems={initialItems} filter={filter} sort={sort} />
      </main>
    </AppShell>
  );
}
