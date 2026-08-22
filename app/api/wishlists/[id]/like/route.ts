import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: existing }, { data: wishlist }] = await Promise.all([
    supabaseAdmin.from("wishlist_likes").select("id").eq("wishlist_id", id).eq("user_id", user.id).maybeSingle(),
    supabaseAdmin.from("wishlists").select("user_id").eq("id", id).single(),
  ]);

  if (existing) {
    await supabaseAdmin.from("wishlist_likes").delete().eq("id", existing.id);
  } else {
    await supabaseAdmin.from("wishlist_likes").insert({ wishlist_id: id, user_id: user.id });

    if (wishlist && wishlist.user_id !== user.id) {
      supabaseAdmin.from("notifications").insert({
        user_id: wishlist.user_id,
        type: "wishlist_liked" as const,
        actor_id: user.id,
        wishlist_id: id,
      }).then(({ error }) => {
        if (error) console.error("[notification] wishlist_liked insert failed:", error);
      });
    }
  }

  const { count } = await supabaseAdmin
    .from("wishlist_likes")
    .select("id", { count: "exact", head: true })
    .eq("wishlist_id", id);

  return NextResponse.json({ liked: !existing, count: count ?? 0 });
}
