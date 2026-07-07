import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getReservationCount } from "@/lib/reservations";

async function verifyOwner(itemId: string, userId: string) {
  const { data: item } = await supabaseAdmin
    .from("wish_items")
    .select("wishlist_id")
    .eq("id", itemId)
    .single();
  if (!item) return false;

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id")
    .eq("id", item.wishlist_id)
    .eq("user_id", userId)
    .single();
  return !!wishlist;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await verifyOwner(id, user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (body.quantity != null) {
    const reservationCount = await getReservationCount(id);
    if (body.quantity < reservationCount) {
      return NextResponse.json(
        { error: "quantity_below_reservations", reservationCount },
        { status: 400 }
      );
    }
  }

  const { error } = await supabaseAdmin
    .from("wish_items")
    .update(body)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!await verifyOwner(id, user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("wish_items")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
