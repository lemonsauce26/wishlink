import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { target_wishlist_id } = body;
  if (!target_wishlist_id)
    return NextResponse.json({ error: "target_wishlist_id required" }, { status: 400 });

  const [{ data: targetWishlist }, { data: sourceItem }] = await Promise.all([
    supabaseAdmin
      .from("wishlists")
      .select("id")
      .eq("id", target_wishlist_id)
      .eq("user_id", user.id)
      .single(),
    supabaseAdmin.from("wish_items").select("*").eq("id", itemId).single(),
  ]);

  if (!targetWishlist) return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
  if (!sourceItem) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const { error: insertError } = await supabaseAdmin.from("wish_items").insert({
    wishlist_id: target_wishlist_id,
    title: sourceItem.title,
    image_url: sourceItem.image_url,
    price: sourceItem.price,
    currency: sourceItem.currency,
    product_url: sourceItem.product_url,
    store_name: sourceItem.store_name,
    priority: sourceItem.priority,
    quantity: sourceItem.quantity,
    note: sourceItem.note,
    receiving_method: sourceItem.receiving_method,
    receiving_detail: sourceItem.receiving_detail,
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  const { data: currentStats } = await supabaseAdmin
    .from("wishlist_stats")
    .select("item_copy_count, copy_count")
    .eq("wishlist_id", sourceItem.wishlist_id)
    .maybeSingle();

  await supabaseAdmin.from("wishlist_stats").upsert({
    wishlist_id: sourceItem.wishlist_id,
    item_copy_count: (currentStats?.item_copy_count ?? 0) + 1,
    copy_count: currentStats?.copy_count ?? 0,
  });

  supabaseAdmin.from("wishlists").select("user_id").eq("id", sourceItem.wishlist_id).single()
    .then(({ data: sourceWishlist }) => {
      if (!sourceWishlist || sourceWishlist.user_id === user.id) return;
      supabaseAdmin.from("notifications").insert({
        user_id: sourceWishlist.user_id,
        type: "wishitem_saved" as const,
        actor_id: user.id,
        wishlist_id: sourceItem.wishlist_id,
        wish_item_id: itemId,
      }).then(({ error }) => {
        if (error) console.error("[notification] wishitem_saved insert failed:", error);
      });
    });

  return NextResponse.json({ success: true });
}
