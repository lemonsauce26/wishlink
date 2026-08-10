import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LikedWishItemsClient, type LikedWishItem } from "@/components/liked/liked-wishitems-client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const LIMIT = 20;

export default async function LikedWishItemsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: likedRows } = await supabaseAdmin
    .from("wishitem_likes")
    .select("wish_item_id")
    .eq("user_id", user.id)
    .order("liked_at", { ascending: false })
    .range(0, LIMIT - 1);

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
      ? await supabaseAdmin.from("wishlists").select("id, explore_token").in("id", wishlistIds)
      : { data: [] as { id: string; explore_token: string | null }[] };

  const exploreTokenMap = new Map((wishlists ?? []).map((w) => [w.id, w.explore_token]));
  const itemMap = new Map((items ?? []).map((i) => [i.id, i]));

  const initialItems: LikedWishItem[] = itemIds
    .map((id) => itemMap.get(id))
    .filter(Boolean)
    .map((item) => ({
      id: item!.id,
      title: item!.title,
      image_url: item!.image_url,
      price: item!.price,
      currency: item!.currency,
      store_name: item!.store_name,
      explore_token: exploreTokenMap.get(item!.wishlist_id) ?? null,
    }));

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
        </div>
        <LikedWishItemsClient initialItems={initialItems} />
      </main>
    </AppShell>
  );
}
