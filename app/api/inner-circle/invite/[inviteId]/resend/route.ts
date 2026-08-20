import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/email";

export async function POST(
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
  if (invite.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 400 });

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

  try {
    await sendInviteEmail({
      to: invite.invitee_email,
      ownerName: owner?.display_name ?? owner?.email ?? "Someone",
      wishlistTitle: wishlist.title,
      shareToken: wishlist.share_token,
    });
  } catch (err: unknown) {
    const smtpCode = (err as { responseCode?: number }).responseCode ?? null;
    return NextResponse.json({ error: "email_failed", code: smtpCode }, { status: 500 });
  }

  const { data: invitee } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", invite.invitee_email)
    .maybeSingle();

  if (invitee) {
    supabaseAdmin.from("notifications").insert({
      user_id: invitee.id,
      type: "invite_received" as const,
      actor_id: user.id,
      wishlist_id: wishlist.id,
    }).then(({ error }) => {
      if (error) console.error("[notification] invite_received insert failed:", error);
    });
  }

  return NextResponse.json({ success: true });
}
