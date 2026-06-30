import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getReservationCount } from "@/lib/reservations";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wishItemId, name, email, note } = await req.json();
  if (!wishItemId || !name?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: item } = await supabaseAdmin
    .from("wish_items")
    .select("id, quantity, wishlist_id")
    .eq("id", wishItemId)
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

  const reservationCount = await getReservationCount(wishItemId);
  if (reservationCount >= item.quantity) {
    return NextResponse.json({ error: "No slots available" }, { status: 400 });
  }

  const { data: reservation, error } = await supabaseAdmin
    .from("wishitem_reservations")
    .insert({
      wish_item_id: wishItemId,
      reserver_name: name.trim(),
      reserver_email: email?.trim() || null,
      reserver_note: note?.trim() || null,
      user_id: user.id,
      reserved_by_owner: true,
    })
    .select("id")
    .single();

  if (error || !reservation) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true, id: reservation.id });
}
