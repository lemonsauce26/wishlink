import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendReservationCancelledEmail } from "@/lib/email";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { reservationId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: reservation } = await supabaseAdmin
    .from("wishitem_reservations")
    .select("id, wish_item_id, user_id, reserver_email")
    .eq("id", params.reservationId)
    .is("cancelled_at", null)
    .single();
  if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: item } = await supabaseAdmin
    .from("wish_items")
    .select("wishlist_id, title")
    .eq("id", reservation.wish_item_id)
    .single();

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("user_id")
    .eq("id", item?.wishlist_id ?? "")
    .single();

  const isOwner = wishlist?.user_id === user.id;
  const isReserver = reservation.user_id === user.id;

  if (!isOwner && !isReserver) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabaseAdmin
    .from("wishitem_reservations")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", params.reservationId);

  if (reservation.reserver_email) {
    sendReservationCancelledEmail({
      to: reservation.reserver_email,
      itemTitle: item?.title ?? "the item",
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
