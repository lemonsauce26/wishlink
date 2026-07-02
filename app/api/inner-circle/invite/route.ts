import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wishlistId, email } = await req.json();
  if (!wishlistId || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, share_token")
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .single();
  if (!wishlist) return NextResponse.json({ error: "not_owner" }, { status: 403 });

  if (user.email?.toLowerCase() === normalizedEmail) {
    return NextResponse.json({ error: "self_invite" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
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

  const { data: owner } = await supabaseAdmin
    .from("users")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("wishlist_invites")
    .insert({ wishlist_id: wishlistId, invitee_email: normalizedEmail })
    .select("id")
    .single();

  if (insertError || !inserted) return NextResponse.json({ error: "Failed" }, { status: 500 });

  try {
    await sendInviteEmail({
      to: normalizedEmail,
      ownerName: owner?.display_name ?? owner?.email ?? "Someone",
      wishlistTitle: wishlist.title,
      shareToken: wishlist.share_token,
    });
  } catch {
    await supabaseAdmin.from("wishlist_invites").delete().eq("id", inserted.id);
    return NextResponse.json({ error: "email_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: inserted.id });
}
