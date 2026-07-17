import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/email";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { inviteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invite } = await supabaseAdmin
    .from("wishlist_invites")
    .select("id, wishlist_id, status, invitee_email")
    .eq("id", inviteId)
    .single();

  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invite.status !== "cancelled") return NextResponse.json({ error: "Not cancelled" }, { status: 400 });

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, share_token")
    .eq("id", invite.wishlist_id)
    .eq("user_id", user.id)
    .single();

  if (!wishlist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: owner } = await supabaseAdmin
    .from("users")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const { error: updateError } = await supabaseAdmin
    .from("wishlist_invites")
    .update({
      status: "pending" as const,
      invited_at: new Date().toISOString(),
      accepted_at: null,
      accepted_user_id: null,
    })
    .eq("id", inviteId);

  if (updateError) return NextResponse.json({ error: "Failed" }, { status: 500 });

  try {
    await sendInviteEmail({
      to: invite.invitee_email,
      ownerName: owner?.display_name ?? owner?.email ?? "Someone",
      wishlistTitle: wishlist.title,
      shareToken: wishlist.share_token,
    });
  } catch (err: unknown) {
    await supabaseAdmin
      .from("wishlist_invites")
      .update({ status: "cancelled" as const })
      .eq("id", inviteId);
    const smtpCode = (err as { responseCode?: number }).responseCode ?? null;
    return NextResponse.json({ error: "email_failed", code: smtpCode }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
