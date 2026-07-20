import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

export default async function FollowingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/following");

  const [{ data: inviteRows }, { data: followRows }] = await Promise.all([
    supabaseAdmin
      .from("wishlist_invites")
      .select("wishlist_id")
      .eq("accepted_user_id", user.id)
      .eq("status", "accepted"),
    supabaseAdmin
      .from("wishlist_follows")
      .select("wishlist_id")
      .eq("user_id", user.id),
  ]);

  const allIds = [
    ...new Set([
      ...(inviteRows ?? []).map((r) => r.wishlist_id),
      ...(followRows ?? []).map((r) => r.wishlist_id),
    ]),
  ];

  if (allIds.length === 0) {
    return (
      <AppShell>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold mb-6">Following</h1>
          <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">💝</p>
            <p className="font-medium">No wishlists yet</p>
            <p className="text-sm">
              Wishlists shared with you or public ones you&apos;ve visited will
              appear here.
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  const { data: wishlists } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, share_token, user_id, event_type")
    .in("id", allIds);

  const ownerIds = [...new Set((wishlists ?? []).map((w) => w.user_id))];
  const { data: owners } = await supabaseAdmin
    .from("users")
    .select("id, display_name, email")
    .in("id", ownerIds);

  const ownerMap = Object.fromEntries(
    (owners ?? []).map((o) => [o.id, o.display_name ?? o.email])
  );

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Following</h1>

        <div className="space-y-3">
          {(wishlists ?? []).map((wl) => {
            const ownerName = ownerMap[wl.user_id] ?? "Unknown";
            const emoji = EVENT_EMOJI[wl.event_type] ?? "🎁";
            return (
              <Link
                key={wl.id}
                href={`/share/${wl.share_token}`}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-4 hover:bg-secondary/40 transition-colors"
              >
                <span className="text-xl">{emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{ownerName}의</p>
                  <p className="font-medium truncate">{wl.title}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
