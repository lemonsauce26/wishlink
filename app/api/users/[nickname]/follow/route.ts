import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ nickname: string }> }
) {
  const { nickname } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: target } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("nickname", nickname)
    .single();

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("followee_id", target.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("follows").delete().eq("id", existing.id);
  } else {
    await supabaseAdmin.from("follows").insert({ follower_id: user.id, followee_id: target.id });
  }

  const { count } = await supabaseAdmin
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("followee_id", target.id);

  return NextResponse.json({ following: !existing, count: count ?? 0 });
}
