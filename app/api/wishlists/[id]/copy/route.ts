import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateUniqueToken } from "@/lib/tokens";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sourceId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: sourceWishlist }, { data: sourceItems }] = await Promise.all([
    supabaseAdmin
      .from("wishlists")
      .select("user_id, title, event_type, event_date")
      .eq("id", sourceId)
      .single(),
    supabaseAdmin
      .from("wish_items")
      .select("title, image_url, price, currency, product_url, store_name, priority, quantity, note, receiving_method, receiving_detail")
      .eq("wishlist_id", sourceId)
      .order("created_at", { ascending: true }),
  ]);

  if (!sourceWishlist) return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });

  const [shareToken, now] = await Promise.all([
    generateUniqueToken("share_token"),
    Promise.resolve(new Date().toISOString()),
  ]);

  const { data: newWishlist, error: createError } = await supabaseAdmin
    .from("wishlists")
    .insert({
      user_id: user.id,
      title: `${sourceWishlist.title}-copied`,
      event_type: sourceWishlist.event_type,
      event_date: sourceWishlist.event_date,
      visibility: "public",
      reservation_visibility: "show",
      share_token: shareToken,
      updated_at: now,
    })
    .select("id")
    .single();

  if (createError || !newWishlist)
    return NextResponse.json({ error: createError?.message }, { status: 500 });

  if (sourceItems && sourceItems.length > 0) {
    const itemsToInsert = sourceItems.map((item) => ({
      ...item,
      wishlist_id: newWishlist.id,
    }));
    await supabaseAdmin.from("wish_items").insert(itemsToInsert);
  }

  const { data: currentStats } = await supabaseAdmin
    .from("wishlist_stats")
    .select("copy_count, item_copy_count")
    .eq("wishlist_id", sourceId)
    .maybeSingle();

  await supabaseAdmin.from("wishlist_stats").upsert({
    wishlist_id: sourceId,
    copy_count: (currentStats?.copy_count ?? 0) + 1,
    item_copy_count: currentStats?.item_copy_count ?? 0,
  });

  if (sourceWishlist.user_id !== user.id) {
    supabaseAdmin.from("notifications").insert({
      user_id: sourceWishlist.user_id,
      type: "wishlist_copied" as const,
      actor_id: user.id,
      wishlist_id: sourceId,
    }).then(({ error }) => {
      if (error) console.error("[notification] wishlist_copied insert failed:", error);
    });
  }

  return NextResponse.json({ id: newWishlist.id });
}
