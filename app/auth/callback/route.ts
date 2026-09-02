import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id, nickname")
        .eq("id", data.user.id)
        .single();

      if (!existing) {
        await supabaseAdmin.from("users").insert({
          id: data.user.id,
          email: data.user.email!,
          display_name: data.user.user_metadata?.full_name ?? null,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          provider: data.user.app_metadata?.provider ?? "google",
        });
        return NextResponse.redirect(`${origin}/setup/nickname`);
      }

      if (!existing.nickname) {
        return NextResponse.redirect(`${origin}/setup/nickname`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
