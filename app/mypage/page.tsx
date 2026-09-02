import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MyPageClient } from "./mypage-client";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/mypage");

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("display_name, nickname, email, avatar_url, created_at, age_group, gender")
    .eq("id", user.id)
    .single();

  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <AppShell>
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-8">My Page</h1>
        <MyPageClient
          userId={user.id}
          displayName={profile?.display_name ?? ""}
          initialNickname={profile?.nickname ?? ""}
          email={profile?.email ?? user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
          joinedAt={joinedAt}
          initialAgeGroup={profile?.age_group ?? ""}
          initialGender={profile?.gender ?? ""}
        />
      </main>
    </AppShell>
  );
}
