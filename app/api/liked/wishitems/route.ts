import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LIMIT = 20;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Number(searchParams.get("limit") ?? LIMIT);
  const offset = (page - 1) * limit;

  const { data: likedRows } = await supabaseAdmin
    .from("wishitem_likes")
    .select("wish_item_id")
    .eq("user_id", user.id)
    .order("liked_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const itemIds = (likedRows ?? []).map((r) => r.wish_item_id);
  if (itemIds.length === 0) return NextResponse.json({ items: [], hasMore: false });

  const { data: items } = await supabaseAdmin
    .from("wish_items")
    .select("id, title, image_url, price, currency, store_name, wishlist_id")
    .in("id", itemIds);

  const wishlistIds = [...new Set((items ?? []).map((i) => i.wishlist_id))];
  const { data: wishlists } = await supabaseAdmin
    .from("wishlists")
    .select("id, explore_token")
    .in("id", wishlistIds);

  const exploreTokenMap = new Map((wishlists ?? []).map((w) => [w.id, w.explore_token]));
  const itemMap = new Map((items ?? []).map((i) => [i.id, i]));

  const result = itemIds
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

  return NextResponse.json({ items: result, hasMore: itemIds.length === limit });
}
