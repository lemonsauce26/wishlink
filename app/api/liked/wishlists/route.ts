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
    .from("wishlist_likes")
    .select("wishlist_id")
    .eq("user_id", user.id)
    .order("liked_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const wishlistIds = (likedRows ?? []).map((r) => r.wishlist_id);
  if (wishlistIds.length === 0) return NextResponse.json({ items: [], hasMore: false });

  const { data: wishlists } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, event_type, user_id, explore_token")
    .in("id", wishlistIds);

  const userIds = [...new Set((wishlists ?? []).map((w) => w.user_id))];
  const { data: owners } = await supabaseAdmin
    .from("users")
    .select("id, nickname")
    .in("id", userIds);

  const ownerMap = new Map((owners ?? []).map((u) => [u.id, u.nickname]));
  const wishlistMap = new Map((wishlists ?? []).map((w) => [w.id, w]));

  const items = wishlistIds
    .map((id) => wishlistMap.get(id))
    .filter(Boolean)
    .map((w) => ({
      id: w!.id,
      title: w!.title,
      event_type: w!.event_type,
      explore_token: w!.explore_token,
      nickname: ownerMap.get(w!.user_id) ?? null,
    }));

  return NextResponse.json({ items, hasMore: wishlistIds.length === limit });
}
