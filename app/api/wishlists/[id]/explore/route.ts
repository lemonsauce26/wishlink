import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateUniqueToken } from "@/lib/tokens";
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

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id, user_id, visibility, explore_token")
    .eq("id", id)
    .single();

  if (!wishlist || wishlist.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (wishlist.visibility !== "public")
    return NextResponse.json(
      { error: "Only public wishlists can be posted to Explore" },
      { status: 400 }
    );

  if (wishlist.explore_token)
    return NextResponse.json({ explore_token: wishlist.explore_token });

  const token = await generateUniqueToken("explore_token");
  await supabaseAdmin
    .from("wishlists")
    .update({ explore_token: token })
    .eq("id", id);

  const { data: followers } = await supabaseAdmin
    .from("follows")
    .select("follower_id")
    .eq("followee_id", user.id);

  if (followers && followers.length > 0) {
    supabaseAdmin.from("notifications").insert(
      followers.map((f) => ({
        user_id: f.follower_id,
        type: "following_post" as const,
        actor_id: user.id,
        wishlist_id: id,
      }))
    ).then(({ error }) => {
      if (error) console.error("[notification] following_post insert failed:", error);
    });
  }

  return NextResponse.json({ explore_token: token });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (!wishlist || wishlist.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabaseAdmin
    .from("wishlists")
    .update({ explore_token: null })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
