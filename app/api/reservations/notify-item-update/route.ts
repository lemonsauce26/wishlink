import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getActiveReservations } from "@/lib/reservations";
import { sendItemUpdateEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId } = await req.json();
  if (!itemId) return NextResponse.json({ error: "Missing itemId" }, { status: 400 });

  const { data: item } = await supabaseAdmin
    .from("wish_items")
    .select("title, wishlist_id")
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

  const { data: owner } = await supabaseAdmin
    .from("users")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const reservations = await getActiveReservations(itemId);
  const ownerName = owner?.display_name ?? owner?.email ?? "Someone";

  await Promise.allSettled(
    reservations
      .filter((r) => r.reserver_email)
      .map((r) =>
        sendItemUpdateEmail({
          to: r.reserver_email!,
          ownerName,
          itemTitle: item.title,
        })
      )
  );

  return NextResponse.json({ success: true });
}
