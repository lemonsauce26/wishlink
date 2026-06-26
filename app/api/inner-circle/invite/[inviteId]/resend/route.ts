import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInviteEmail } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: { inviteId: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invite } = await supabase
    .from("wishlist_invites")
    .select("id, wishlist_id, status, invitee_email")
    .eq("id", params.inviteId)
    .single();

  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (invite.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 400 });

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, title, share_token")
    .eq("id", invite.wishlist_id)
    .eq("user_id", user.id)
    .single();

  if (!wishlist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: owner } = await supabase
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
  } catch {
    return NextResponse.json({ error: "email_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
