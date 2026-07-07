import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    .select("id, wishlist_id")
    .eq("id", inviteId)
    .single();

  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id")
    .eq("id", invite.wishlist_id)
    .eq("user_id", user.id)
    .single();

  if (!wishlist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabaseAdmin
    .from("wishlist_invites")
    .update({ status: "cancelled" })
    .eq("id", inviteId);

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });

  return NextResponse.json({ success: true });
}
