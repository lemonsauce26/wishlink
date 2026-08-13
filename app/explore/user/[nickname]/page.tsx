import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ExploreCard } from "@/components/explore/explore-card";
import { FollowButton } from "@/components/follow/follow-button";
import Link from "next/link";

export default async function ExploreUserPage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const { nickname } = await params;
  const decodedNickname = decodeURIComponent(nickname);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: owner } = await supabaseAdmin
    .from("users")
    .select("id, avatar_url")
    .eq("nickname", decodedNickname)
    .single();

  if (!owner) notFound();

  const [
    { data: wishlists },
    { count: followerCount },
    existingFollow,
  ] = await Promise.all([
    supabaseAdmin
      .from("wishlists")
      .select("id, title, event_type, explore_token")
      .eq("user_id", owner.id)
      .not("explore_token", "is", null)
      .eq("hidden_by_admin", false)
      .order("updated_at", { ascending: false }),
    supabaseAdmin
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("followee_id", owner.id),
    user && user.id !== owner.id
      ? supabaseAdmin
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("followee_id", owner.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const allWishlists = wishlists ?? [];
  const wishlistIds = allWishlists.map((w) => w.id);

  const { data: allItems } =
    wishlistIds.length > 0
      ? await supabaseAdmin
          .from("wish_items")
          .select("id, wishlist_id, title, image_url")
          .in("wishlist_id", wishlistIds)
          .order("created_at", { ascending: true })
      : { data: [] as { id: string; wishlist_id: string; title: string; image_url: string | null }[] };

  const [{ data: allLikes }, { data: allStats }] =
    wishlistIds.length > 0
      ? await Promise.all([
          supabaseAdmin.from("wishlist_likes").select("wishlist_id").in("wishlist_id", wishlistIds),
          supabaseAdmin
            .from("wishlist_stats")
            .select("wishlist_id, copy_count, item_save_count")
            .in("wishlist_id", wishlistIds),
        ])
      : [{ data: [] }, { data: [] }];

  const itemCountMap: Record<string, number> = {};
  const previewMap: Record<string, { id: string; title: string; image_url: string | null }[]> = {};
  for (const item of allItems ?? []) {
    itemCountMap[item.wishlist_id] = (itemCountMap[item.wishlist_id] ?? 0) + 1;
    if (!previewMap[item.wishlist_id]) previewMap[item.wishlist_id] = [];
    if (previewMap[item.wishlist_id].length < 9) {
      previewMap[item.wishlist_id].push({ id: item.id, title: item.title, image_url: item.image_url });
    }
  }

  const likeCountMap: Record<string, number> = {};
  for (const like of allLikes ?? []) {
    likeCountMap[like.wishlist_id] = (likeCountMap[like.wishlist_id] ?? 0) + 1;
  }
  const statsMap = Object.fromEntries((allStats ?? []).map((s) => [s.wishlist_id, s]));

  const isOwnProfile = user?.id === owner.id;
  const isFollowing = !!existingFollow.data;

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-start gap-3">
          <div className="rounded-full overflow-hidden bg-secondary border border-border shrink-0" style={{ width: 48, height: 48 }}>
            {owner.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={owner.avatar_url} alt={decodedNickname} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {decodedNickname[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg">@{decodedNickname}</p>
            <p className="text-sm text-muted-foreground">{allWishlists.length} wishlists on Explore</p>
          </div>
          {!isOwnProfile && (
            <div className="flex items-center gap-2 shrink-0">
              <FollowButton
                nickname={decodedNickname}
                isLoggedIn={!!user}
                initialFollowing={isFollowing}
                initialCount={followerCount ?? 0}
              />
            </div>
          )}
          {isOwnProfile && followerCount != null && followerCount > 0 && (
            <span className="text-sm text-muted-foreground shrink-0">{followerCount} followers</span>
          )}
        </div>

        {allWishlists.length === 0 ? (
          <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">📭</p>
            <p className="font-medium">No wishlists posted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allWishlists.map((wl) => (
              <ExploreCard
                key={wl.id}
                wishlist={{ title: wl.title, event_type: wl.event_type, explore_token: wl.explore_token! }}
                nickname={decodedNickname}
                itemCount={itemCountMap[wl.id] ?? 0}
                previewItems={previewMap[wl.id] ?? []}
                likeCount={likeCountMap[wl.id] ?? 0}
                saveCount={statsMap[wl.id]?.item_save_count ?? 0}
                copyCount={statsMap[wl.id]?.copy_count ?? 0}
              />
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          <Link href="/explore" className="underline underline-offset-2 hover:text-foreground transition-colors">
            ← Back to Explore
          </Link>
        </p>
      </main>
    </AppShell>
  );
}
