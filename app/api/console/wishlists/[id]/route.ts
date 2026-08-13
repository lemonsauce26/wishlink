import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { hidden_by_admin, reportId, reportStatus } = await req.json();

  const [{ error }] = await Promise.all([
    supabaseAdmin.from("wishlists").update({ hidden_by_admin }).eq("id", id),
    supabaseAdmin.from("admin_report").insert({
      report_id: reportId,
      admin_id: user.id,
      comment: hidden_by_admin ? "Hid this wishlist from Explore" : "Restored this wishlist to Explore",
      status: reportStatus,
    }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
