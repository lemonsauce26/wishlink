import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: existing }, { data: wishItem }] = await Promise.all([
    supabaseAdmin.from("wishitem_likes").select("id").eq("wish_item_id", id).eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("wish_items").select("wishlist_id").eq("id", id).single(),
  ]);

  if (existing) {
    await supabaseAdmin.from("wishitem_likes").delete().eq("id", existing.id);
  } else {
    await supabaseAdmin.from("wishitem_likes").insert({ wish_item_id: id, user_id: user.id });

    if (wishItem) {
      supabaseAdmin.from("wishlists").select("user_id").eq("id", wishItem.wishlist_id).single()
        .then(({ data: wishlist }) => {
          if (!wishlist || wishlist.user_id === user.id) return;
          supabaseAdmin.from("notifications").insert({
            user_id: wishlist.user_id,
            type: "wishitem_liked" as const,
            actor_id: user.id,
            wishlist_id: wishItem.wishlist_id,
            wish_item_id: id,
          }).then(({ error }) => {
            if (error) console.error("[notification] wishitem_liked insert failed:", error);
          });
        });
    }
  }

  const { count } = await supabaseAdmin
    .from("wishitem_likes")
    .select("id", { count: "exact", head: true })
    .eq("wish_item_id", id);

  return NextResponse.json({ liked: !existing, count: count ?? 0 });
}
