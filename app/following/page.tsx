import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FollowingListClient, type FollowingUser } from "@/components/following/following-list-client";
import Link from "next/link";

const LIMIT = 20;

export default async function FollowingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/following");

  const { data: follows } = await supabaseAdmin
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id);

  const followeeIds = (follows ?? []).map((f) => f.followee_id);

  if (followeeIds.length === 0) {
    return (
      <AppShell>
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <h1 className="text-xl font-bold">Following</h1>
          <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">🔭</p>
            <p className="font-medium">No one followed yet</p>
            <p className="text-sm">
              Follow someone on{" "}
              <Link href="/explore" className="text-emerald-600 hover:underline">
                Explore
              </Link>{" "}
              to see them here.
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  const pagedIds = followeeIds.slice(0, LIMIT);
  const [{ data: users }, { data: followerCounts }] = await Promise.all([
    supabaseAdmin.from("users").select("id, nickname, avatar_url").in("id", pagedIds),
    supabaseAdmin.from("follows").select("followee_id").in("followee_id", pagedIds),
  ]);

  const countMap: Record<string, number> = {};
  for (const row of followerCounts ?? []) {
    countMap[row.followee_id] = (countMap[row.followee_id] ?? 0) + 1;
  }

  const initialItems: FollowingUser[] = (users ?? []).map((u) => ({
    id: u.id,
    nickname: u.nickname ?? "",
    avatar_url: u.avatar_url,
    followerCount: countMap[u.id] ?? 0,
  }));

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">Following</h1>
        <FollowingListClient initialItems={initialItems} />
      </main>
    </AppShell>
  );
}
