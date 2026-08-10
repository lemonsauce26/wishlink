import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const EXPLORE_LIMIT = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Number(searchParams.get("limit") ?? EXPLORE_LIMIT);
  const filter = searchParams.get("filter") ?? "all";
  const sort = searchParams.get("sort") ?? "latest";
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("wishlists")
    .select("id, title, event_type, user_id, explore_token, updated_at")
    .not("explore_token", "is", null)
    .range(offset, offset + limit - 1);

  if (filter !== "all") query = query.eq("event_type", filter);
  query = query.order("updated_at", { ascending: sort === "oldest" });

  const { data: wishlists, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const allWishlists = wishlists ?? [];
  if (allWishlists.length === 0) {
    return NextResponse.json({ items: [], hasMore: false });
  }

  const userIds = [...new Set(allWishlists.map((w) => w.user_id))];
  const wishlistIds = allWishlists.map((w) => w.id);

  const [{ data: owners }, { data: allItems }, { data: allLikes }, { data: allStats }] =
    await Promise.all([
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
    ]);

  const nicknameMap = Object.fromEntries((owners ?? []).map((o) => [o.id, o.nickname ?? ""]));
  const likeCountMap: Record<string, number> = {};
  for (const l of allLikes ?? []) {
    likeCountMap[l.wishlist_id] = (likeCountMap[l.wishlist_id] ?? 0) + 1;
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

  const items = allWishlists.map((wl) => ({
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

  return NextResponse.json({ items, hasMore: allWishlists.length === limit });
}
