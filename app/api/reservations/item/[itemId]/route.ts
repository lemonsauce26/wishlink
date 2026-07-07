import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getActiveReservations } from "@/lib/reservations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: item } = await supabaseAdmin
    .from("wish_items")
    .select("wishlist_id")
    .eq("id", itemId)
    .single();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("user_id")
    .eq("id", item.wishlist_id)
    .single();
  if (!wishlist || wishlist.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reservations = await getActiveReservations(itemId);
  return NextResponse.json({ reservations });
}
