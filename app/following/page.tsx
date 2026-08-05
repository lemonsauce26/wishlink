import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import Link from "next/link";

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
        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
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

  const [{ data: users }, { data: followerCounts }] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("id, nickname, avatar_url")
      .in("id", followeeIds),
    supabaseAdmin
      .from("follows")
      .select("followee_id")
      .in("followee_id", followeeIds),
  ]);

  const countMap: Record<string, number> = {};
  for (const row of followerCounts ?? []) {
    countMap[row.followee_id] = (countMap[row.followee_id] ?? 0) + 1;
  }

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">Following</h1>

        <div className="space-y-2">
          {(users ?? []).map((u) => {
            const nickname = u.nickname ?? "";
            const count = countMap[u.id] ?? 0;
            return (
              <Link
                key={u.id}
                href={`/explore/user/${encodeURIComponent(nickname)}`}
                className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-secondary/40 transition-colors"
              >
                <div
                  className="rounded-full overflow-hidden bg-secondary border border-border shrink-0"
                  style={{ width: 40, height: 40 }}
                >
                  {u.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.avatar_url}
                      alt={nickname}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {nickname[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">@{nickname}</p>
                  {count > 0 && (
                    <p className="text-xs text-muted-foreground">{count} followers</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
