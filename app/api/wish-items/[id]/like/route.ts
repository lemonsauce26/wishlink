import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabaseAdmin
    .from("wishitem_likes")
    .select("id")
    .eq("wish_item_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("wishitem_likes").delete().eq("id", existing.id);
  } else {
    await supabaseAdmin.from("wishitem_likes").insert({ wish_item_id: id, user_id: user.id });
  }

  const { count } = await supabaseAdmin
    .from("wishitem_likes")
    .select("id", { count: "exact", head: true })
    .eq("wish_item_id", id);

  return NextResponse.json({ liked: !existing, count: count ?? 0 });
}
