import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";

export default async function LikedWishItemsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: likedRows } = await supabaseAdmin
    .from("wishitem_likes")
    .select("wish_item_id, liked_at")
    .eq("user_id", user.id)
    .order("liked_at", { ascending: false });

  const itemIds = (likedRows ?? []).map((r) => r.wish_item_id);

  const { data: items } =
    itemIds.length > 0
      ? await supabaseAdmin
          .from("wish_items")
          .select("id, title, image_url, price, currency, store_name, wishlist_id")
          .in("id", itemIds)
      : { data: [] as { id: string; title: string; image_url: string | null; price: number | null; currency: string | null; store_name: string | null; wishlist_id: string }[] };

  const wishlistIds = [...new Set((items ?? []).map((i) => i.wishlist_id))];
  const { data: wishlists } =
    wishlistIds.length > 0
      ? await supabaseAdmin
          .from("wishlists")
          .select("id, explore_token")
          .in("id", wishlistIds)
      : { data: [] as { id: string; explore_token: string | null }[] };

  const exploreTokenMap = new Map((wishlists ?? []).map((w) => [w.id, w.explore_token]));
  const itemMap = new Map((items ?? []).map((i) => [i.id, i]));
  const sorted = (itemIds.map((id) => itemMap.get(id)).filter(Boolean) as NonNullable<typeof items>);

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <Link
            href="/liked"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Liked
          </Link>
          <h1 className="text-2xl font-semibold">Liked Wish Items</h1>
          <p className="text-sm text-muted-foreground">{sorted.length} wish items</p>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">❤️</p>
            <p className="font-medium">No liked wish items yet</p>
            <Link href="/explore" className="text-sm text-emerald-600 hover:underline">
              Browse Explore →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((item) => {
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
          </div>
        )}
      </main>
    </AppShell>
  );
}
