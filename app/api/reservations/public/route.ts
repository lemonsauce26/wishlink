import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getReservationCount } from "@/lib/reservations";
import { sendReservationConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { wishItemId, name, email, note } = await req.json();
  if (!wishItemId || !name?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!user && !email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const { data: item } = await supabaseAdmin
    .from("wish_items")
    .select("id, quantity, wishlist_id, title")
    .eq("id", wishItemId)
    .single();
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id, user_id, reservation_visibility")
    .eq("id", item.wishlist_id)
    .single();
  if (!wishlist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (wishlist.reservation_visibility === "verified" && !user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  if (user && wishlist.user_id === user.id) {
    return NextResponse.json({ error: "Owner cannot reserve own item" }, { status: 403 });
  }

  const reservationCount = await getReservationCount(wishItemId);
  if (reservationCount >= item.quantity) {
    return NextResponse.json({ error: "No slots available" }, { status: 400 });
  }

  const cancelToken = !user ? crypto.randomUUID() : null;

  const { data: reservation, error } = await supabaseAdmin
    .from("wishitem_reservations")
    .insert({
      wish_item_id: wishItemId,
      reserver_name: name.trim(),
      reserver_email: email?.trim() || null,
      reserver_note: note?.trim() || null,
      user_id: user?.id ?? null,
      reserved_by_owner: false,
      cancel_token: cancelToken,
    })
    .select("id")
    .single();

  if (error || !reservation) return NextResponse.json({ error: "Failed" }, { status: 500 });

  const recipientEmail = email?.trim() || user?.email;
  if (recipientEmail) {
    const { data: owner } = await supabaseAdmin
      .from("users")
      .select("display_name, email")
      .eq("id", wishlist.user_id)
      .single();
    const ownerName = owner?.display_name ?? owner?.email ?? "Someone";

    const cancelUrl = cancelToken
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/reservations/cancel/${cancelToken}`
      : undefined;

    sendReservationConfirmationEmail({
      to: recipientEmail,
      reserverName: name.trim(),
      itemTitle: item.title,
      ownerName,
      cancelUrl,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, id: reservation.id });
}
