import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nickname } = await req.json();
  if (!nickname?.trim()) return NextResponse.json({ error: "Invalid nickname" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("nickname", nickname.trim())
    .maybeSingle();

  return NextResponse.json({ available: !existing });
}
