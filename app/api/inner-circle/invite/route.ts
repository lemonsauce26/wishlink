import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wishlistId, email } = await req.json();
  if (!wishlistId || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id")
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .single();
  if (!wishlist) return NextResponse.json({ error: "not_owner" }, { status: 403 });

  if (user.email?.toLowerCase() === normalizedEmail) {
    return NextResponse.json({ error: "self_invite" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("wishlist_invites")
    .select("id, status")
    .eq("wishlist_id", wishlistId)
    .eq("invitee_email", normalizedEmail)
    .single();

  if (existing) {
    if (existing.status === "cancelled") {
      return NextResponse.json({ error: "previously_cancelled", id: existing.id }, { status: 409 });
    }
    return NextResponse.json({ error: "already_invited" }, { status: 409 });
  }

  const { data: inserted, error } = await supabase
    .from("wishlist_invites")
    .insert({ wishlist_id: wishlistId, invitee_email: normalizedEmail })
    .select("id")
    .single();

  if (error || !inserted) return NextResponse.json({ error: "Failed" }, { status: 500 });

  return NextResponse.json({ success: true, id: inserted.id });
}
