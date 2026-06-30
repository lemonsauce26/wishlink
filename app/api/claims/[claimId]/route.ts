import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { claimId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: claim } = await supabaseAdmin
    .from("wishitem_claims")
    .select("id, wish_item_id")
    .eq("id", params.claimId)
    .is("cancelled_at", null)
    .single();
  if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: item } = await supabaseAdmin
    .from("wish_items")
    .select("wishlist_id")
    .eq("id", claim.wish_item_id)
    .single();

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("user_id")
    .eq("id", item?.wishlist_id ?? "")
    .single();

  if (!wishlist || wishlist.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabaseAdmin
    .from("wishitem_claims")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", params.claimId);

  return NextResponse.json({ success: true });
}
