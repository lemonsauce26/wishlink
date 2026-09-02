import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { display_name, avatar_url, age_group, gender } = body;

  if (!display_name?.trim() && !avatar_url && age_group === undefined && gender === undefined)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const updates: { display_name?: string; avatar_url?: string; age_group?: string | null; gender?: string | null; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (display_name?.trim()) updates.display_name = display_name.trim();
  if (avatar_url) updates.avatar_url = avatar_url;
  if (age_group !== undefined) updates.age_group = age_group || null;
  if (gender !== undefined) updates.gender = gender || null;

  const { error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
