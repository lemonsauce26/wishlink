import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

export default async function LikedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { data: likedWishlists },
    { data: likedItemRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("wishlist_likes")
      .select("wishlist_id, liked_at")
      .eq("user_id", user.id)
      .order("liked_at", { ascending: false }),
    supabaseAdmin
      .from("wishitem_likes")
      .select("wish_item_id, liked_at")
      .eq("user_id", user.id)
      .order("liked_at", { ascending: false }),
  ]);

  // --- Liked Wishlists ---
  const wishlistIds = (likedWishlists ?? []).map((r) => r.wishlist_id);
  const { data: wishlists } =
    wishlistIds.length > 0
      ? await supabaseAdmin
          .from("wishlists")
          .select("id, title, event_type, user_id, explore_token")
          .in("id", wishlistIds)
      : { data: [] as { id: string; title: string; event_type: string; user_id: string; explore_token: string | null }[] };

  const wishlistUserIds = [...new Set((wishlists ?? []).map((w) => w.user_id))];
  const { data: wishlistOwners } =
    wishlistUserIds.length > 0
      ? await supabaseAdmin
          .from("users")
          .select("id, nickname")
          .in("id", wishlistUserIds)
      : { data: [] as { id: string; nickname: string }[] };

  const ownerMap = new Map((wishlistOwners ?? []).map((u) => [u.id, u.nickname]));
  const wishlistMap = new Map((wishlists ?? []).map((w) => [w.id, w]));
  const sortedWishlists = (wishlistIds.map((id) => wishlistMap.get(id)).filter(Boolean) as NonNullable<typeof wishlists>);
  const previewWishlists = sortedWishlists.slice(0, 3);

  // --- Liked Items ---
  const itemIds = (likedItemRows ?? []).map((r) => r.wish_item_id);
  const { data: items } =
    itemIds.length > 0
      ? await supabaseAdmin
          .from("wish_items")
          .select("id, title, image_url, price, currency, store_name, wishlist_id")
          .in("id", itemIds)
      : { data: [] as { id: string; title: string; image_url: string | null; price: number | null; currency: string | null; store_name: string | null; wishlist_id: string }[] };

  const itemWishlistIds = [...new Set((items ?? []).map((i) => i.wishlist_id))];
  const { data: itemWishlists } =
    itemWishlistIds.length > 0
      ? await supabaseAdmin
          .from("wishlists")
          .select("id, explore_token")
          .in("id", itemWishlistIds)
      : { data: [] as { id: string; explore_token: string | null }[] };

  const exploreTokenMap = new Map((itemWishlists ?? []).map((w) => [w.id, w.explore_token]));
  const itemMap = new Map((items ?? []).map((i) => [i.id, i]));
  const sortedItems = (itemIds.map((id) => itemMap.get(id)).filter(Boolean) as NonNullable<typeof items>);
  const previewItems = sortedItems.slice(0, 3);

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        <h1 className="text-2xl font-semibold">Liked</h1>

        {/* Liked Wishlists */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Wishlists
            </h2>
            {sortedWishlists.length > 0 && (
              <Link href="/liked/wishlists" className="text-xs text-emerald-600 hover:underline">
                View all →
              </Link>
            )}
          </div>
          {previewWishlists.length === 0 ? (
            <div className="rounded-xl border border-border p-8 text-center text-muted-foreground space-y-2">
              <p className="text-3xl">🎁</p>
              <p className="text-sm">No liked wishlists yet.</p>
              <Link href="/explore" className="text-sm text-emerald-600 hover:underline">
                Browse Explore →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {previewWishlists.map((w) => {
                const emoji = EVENT_EMOJI[w.event_type] ?? "🎁";
                const href = w.explore_token ? `/explore/${w.explore_token}` : null;
                const nickname = ownerMap.get(w.user_id);
                const inner = (
                  <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-secondary transition-colors">
                    <span className="text-xl shrink-0">{emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{w.title}</p>
                      {nickname && (
                        <p className="text-xs text-muted-foreground mt-0.5">@{nickname}</p>
                      )}
                    </div>
                  </div>
                );
                return href ? (
                  <Link key={w.id} href={href}>
                    {inner}
                  </Link>
                ) : (
                  <div key={w.id}>{inner}</div>
                );
              })}
              {sortedWishlists.length > 3 && (
                <Link
                  href="/liked/wishlists"
                  className="flex items-center justify-center rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  View all {sortedWishlists.length} wishlists →
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Liked Items */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Wish Items
            </h2>
            {sortedItems.length > 0 && (
              <Link href="/liked/wishitems" className="text-xs text-emerald-600 hover:underline">
                View all →
              </Link>
            )}
          </div>
          {previewItems.length === 0 ? (
            <div className="rounded-xl border border-border p-8 text-center text-muted-foreground space-y-2">
              <p className="text-3xl">❤️</p>
              <p className="text-sm">No liked items yet.</p>
              <Link href="/explore" className="text-sm text-emerald-600 hover:underline">
                Browse Explore →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {previewItems.map((item) => {
                const token = exploreTokenMap.get(item.wishlist_id);
                const exploreHref = token ? `/explore/${token}` : null;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
                  >
                    {item.image_url && (
                      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-secondary">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.title}</p>
                      {item.price != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.currency} {item.price.toLocaleString()}
                        </p>
                      )}
                      {item.store_name && (
                        <p className="text-xs text-muted-foreground">{item.store_name}</p>
                      )}
                    </div>
                    {exploreHref && (
                      <Link
                        href={exploreHref}
                        className="shrink-0 p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="위시리스트 보기"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                );
              })}
              {sortedItems.length > 3 && (
                <Link
                  href="/liked/wishitems"
                  className="flex items-center justify-center rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  View all wish items →
                </Link>
              )}
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
