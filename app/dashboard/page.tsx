import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

const VISIBILITY_LABEL: Record<string, string> = {
  public: "Public",
  private: "Private",
  inner_circle: "Inner Circle",
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-yellow-400",
  medium: "bg-blue-400",
  low: "bg-muted-foreground/30",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // My Wishlists: GREATEST(wishlist.updated_at, max(wish_items.updated_at))
  const { data: wishlistRows } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, event_type, event_date, visibility, explore_token, hidden_by_admin, updated_at")
    .eq("user_id", user.id);

  const wishlistIds = (wishlistRows ?? []).map((w) => w.id);

  const { data: allItems } = wishlistIds.length > 0
    ? await supabaseAdmin
        .from("wish_items")
        .select("id, wishlist_id, updated_at")
        .in("wishlist_id", wishlistIds)
    : { data: [] };

  const itemsByWishlist = (allItems ?? []).reduce<Record<string, { count: number; maxUpdatedAt: string }>>(
    (acc, item) => {
      const cur = acc[item.wishlist_id] ?? { count: 0, maxUpdatedAt: "" };
      return {
        ...acc,
        [item.wishlist_id]: {
          count: cur.count + 1,
          maxUpdatedAt: item.updated_at > cur.maxUpdatedAt ? item.updated_at : cur.maxUpdatedAt,
        },
      };
    },
    {}
  );

  const myItemIds = (allItems ?? []).map((i) => i.id);

  const [{ data: wishlistLikes }, { data: wishlistStatsRows }, { data: wishitemLikes }] =
    await Promise.all([
      wishlistIds.length > 0
        ? supabaseAdmin.from("wishlist_likes").select("wishlist_id").in("wishlist_id", wishlistIds)
        : Promise.resolve({ data: [] as { wishlist_id: string }[] }),
      wishlistIds.length > 0
        ? supabaseAdmin.from("wishlist_stats").select("wishlist_id, item_copy_count, copy_count").in("wishlist_id", wishlistIds)
        : Promise.resolve({ data: [] as { wishlist_id: string; item_copy_count: number; copy_count: number }[] }),
      myItemIds.length > 0
        ? supabaseAdmin.from("wishitem_likes").select("wish_item_id").in("wish_item_id", myItemIds)
        : Promise.resolve({ data: [] as { wish_item_id: string }[] }),
    ]);

  const myExploreWishlists = (wishlistRows ?? []).filter((w) => w.explore_token != null);
  const visibleExploreIds = new Set(myExploreWishlists.filter((w) => !w.hidden_by_admin).map((w) => w.id));

  const visibleItemIds = new Set(
    (allItems ?? []).filter((i) => visibleExploreIds.has(i.wishlist_id)).map((i) => i.id)
  );
  const totalWishlistLikes = (wishlistLikes ?? []).filter((l) => visibleExploreIds.has(l.wishlist_id)).length;
  const totalWishitemLikes = (wishitemLikes ?? []).filter((l) => visibleItemIds.has(l.wish_item_id)).length;
  const visibleStats = (wishlistStatsRows ?? []).filter((s) => visibleExploreIds.has(s.wishlist_id));
  const totalItemSaves = visibleStats.reduce((sum, s) => sum + (s.item_copy_count ?? 0), 0);
  const totalWishlistCopies = visibleStats.reduce((sum, s) => sum + (s.copy_count ?? 0), 0);

  const likeCountMap: Record<string, number> = {};
  for (const like of wishlistLikes ?? []) {
    likeCountMap[like.wishlist_id] = (likeCountMap[like.wishlist_id] ?? 0) + 1;
  }

  const { data: followRows } = await supabaseAdmin
    .from("follows")
    .select("followee_id, followed_at")
    .eq("follower_id", user.id)
    .order("followed_at", { ascending: false });

  const followeeIds = (followRows ?? []).map((f) => f.followee_id);

  const { data: followeeUsers } = followeeIds.length > 0
    ? await supabaseAdmin
        .from("users")
        .select("id, nickname, avatar_url")
        .in("id", followeeIds)
    : { data: [] as { id: string; nickname: string | null; avatar_url: string | null }[] };

  const followeeMap = Object.fromEntries((followeeUsers ?? []).map((u) => [u.id, u]));
  const followingList = followeeIds.map((id) => followeeMap[id]).filter(Boolean);

  const recentWishlists = (wishlistRows ?? [])
    .map((w) => {
      const itemData = itemsByWishlist[w.id] ?? { count: 0, maxUpdatedAt: "" };
      const wUpdatedAt = w.updated_at ?? "";
      const lastActivity = itemData.maxUpdatedAt > wUpdatedAt ? itemData.maxUpdatedAt : wUpdatedAt;
      return { ...w, itemCount: itemData.count, lastActivity };
    })
    .sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""))
    .slice(0, 2);

  // My Reservations: top 2 by reserved_at
  const { data: reservations } = await supabaseAdmin
    .from("wishitem_reservations")
    .select("id, wish_item_id, reserved_at, cancel_token")
    .eq("user_id", user.id)
    .eq("reserved_by_owner", false)
    .is("cancelled_at", null)
    .order("reserved_at", { ascending: false })
    .limit(2);

  type ReservationCard = {
    id: string;
    cancel_token: string | null;
    item: { title: string; image_url: string | null; price: number | null; currency: string; store_name: string | null; priority: string };
    wishlistTitle: string;
    shareToken: string;
    ownerName: string;
  };

  let reservationCards: ReservationCard[] = [];

  if (reservations && reservations.length > 0) {
    const itemIds = reservations.map((r) => r.wish_item_id);

    const { data: items } = await supabaseAdmin
      .from("wish_items")
      .select("id, wishlist_id, title, image_url, price, currency, store_name, priority")
      .in("id", itemIds);

    const wishlistIds = [...new Set((items ?? []).map((i) => i.wishlist_id))];

    const { data: wishlists } = await supabaseAdmin
      .from("wishlists")
      .select("id, title, share_token, user_id")
      .in("id", wishlistIds);

    const ownerIds = [...new Set((wishlists ?? []).map((w) => w.user_id))];

    const { data: owners } = await supabaseAdmin
      .from("users")
      .select("id, display_name, email")
      .in("id", ownerIds);

    const itemMap = Object.fromEntries((items ?? []).map((i) => [i.id, i]));
    const wishlistMap = Object.fromEntries((wishlists ?? []).map((w) => [w.id, w]));
    const ownerMap = Object.fromEntries(
      (owners ?? []).map((o) => [o.id, o.display_name ?? o.email ?? ""])
    );

    reservationCards = reservations.flatMap((r) => {
      const item = itemMap[r.wish_item_id];
      const wishlist = item ? wishlistMap[item.wishlist_id] : null;
      if (!item || !wishlist) return [];
      return [{
        id: r.id,
        cancel_token: r.cancel_token,
        item,
        wishlistTitle: wishlist.title,
        shareToken: wishlist.share_token,
        ownerName: ownerMap[wishlist.user_id] ?? "",
      }];
    });
  }

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">Dashboard</h1>

        {/* My Wishlists block */}
        <section className="rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">My Wishlists</h2>
            <Link
              href="/wishlists"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See all →
            </Link>
          </div>

          {recentWishlists.length === 0 ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">No wishlists yet.</p>
              <Link
                href="/wishlist/new"
                className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Create your first wishlist →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWishlists.map((w) => {
                const emoji = EVENT_EMOJI[w.event_type] ?? "🎁";
                const date = w.event_date
                  ? new Date(w.event_date + "T00:00:00").toLocaleDateString("en-CA", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : null;
                return (
                  <Link
                    key={w.id}
                    href={`/wishlist/${w.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-2xl shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{w.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {w.itemCount} item{w.itemCount !== 1 ? "s" : ""} · {VISIBILITY_LABEL[w.visibility]}
                        {date && ` · ${date}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* My Reservations block */}
        <section className="rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">My Reservations</h2>
            <Link
              href="/reservations"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See all →
            </Link>
          </div>

          {reservationCards.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-muted-foreground">No reservations yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservationCards.map((r) => (
                <div key={r.id} className="rounded-xl border border-border overflow-hidden">
                  <Link
                    href={`/share/${r.shareToken}`}
                    className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-lg border border-border bg-secondary flex-shrink-0 overflow-hidden">
                      {r.item.image_url ? (
                        <img
                          src={r.item.image_url}
                          alt={r.item.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">🎁</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{r.item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {r.item.price != null && (
                          <span className="text-xs text-muted-foreground">
                            ${r.item.price.toFixed(2)} {r.item.currency}
                          </span>
                        )}
                        {r.item.store_name && (
                          <span className="text-xs text-muted-foreground">· {r.item.store_name}</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[r.item.priority] ?? "bg-muted-foreground/30"}`}
                    />
                  </Link>
                  <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/30 gap-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {r.ownerName && `${r.ownerName}의 `}{r.wishlistTitle}
                    </p>
                    {r.cancel_token && (
                      <Link
                        href={`/reservations/cancel/${r.cancel_token}`}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                      >
                        Cancel
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {/* Following */}
        <section className="rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Following</h2>
            <Link
              href="/following"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See all →
            </Link>
          </div>

          {followingList.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Not following anyone yet.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {followingList.map((u) => (
                <Link
                  key={u.id}
                  href={`/explore/user/${encodeURIComponent(u.nickname ?? u.id)}`}
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-secondary border border-border">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar_url} alt={u.nickname ?? ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                        {(u.nickname ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors max-w-[56px] truncate text-center">
                    @{u.nickname ?? "—"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* My Explore Posts */}
        <section className="rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-base">My Explore Posts</h2>

          <div className="grid grid-cols-4 divide-x divide-border rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold tabular-nums">{totalWishlistLikes}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Wishlist Likes</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold tabular-nums">{totalWishitemLikes}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Wishitem Likes</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold tabular-nums">{totalWishlistCopies}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Wishlist Copied</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold tabular-nums">{totalItemSaves}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Wishitem Copied</p>
            </div>
          </div>

          {myExploreWishlists.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">No wishlists on Explore yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myExploreWishlists.map((w) => {
                const emoji = EVENT_EMOJI[w.event_type] ?? "🎁";
                return (
                  <a
                    key={w.id}
                    href={`/explore/${w.explore_token}`}
                    className="flex items-center gap-3 rounded-xl border border-border p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <span className="text-2xl shrink-0">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{w.title}</p>
                      {w.hidden_by_admin && (
                        <span className="inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                          Hidden by Admin
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <span>♡</span>
                      {likeCountMap[w.id] ?? 0}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
