import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{2,20}$/;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nickname } = await req.json();
  if (!nickname?.trim() || !NICKNAME_REGEX.test(nickname.trim())) {
    return NextResponse.json({ error: "Invalid nickname" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ nickname: nickname.trim(), updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error?.code === "23505") {
    return NextResponse.json({ error: "Nickname already taken" }, { status: 409 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
