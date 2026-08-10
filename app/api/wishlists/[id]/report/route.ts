import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: wishlistId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("user_id")
    .eq("id", wishlistId)
    .single();

  if (!wishlist) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wishlist.user_id === user.id) {
    return NextResponse.json({ error: "Cannot report your own wishlist" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .eq("wishlist_id", wishlistId)
    .maybeSingle();

  if (existing) return NextResponse.json({ reported: true });

  const { reason, comment } = await req.json();
  if (!reason) return NextResponse.json({ error: "Reason required" }, { status: 400 });

  // TEMP: force failure for manual error handling test — set false when done
  // const FORCE_ERROR = true;
  // if (FORCE_ERROR) return NextResponse.json({ error: "forced failure" }, { status: 500 });

  const { error } = await supabaseAdmin.from("reports").insert({
    reporter_id: user.id,
    wishlist_id: wishlistId,
    reason,
    comment: comment ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reported: true });
}
