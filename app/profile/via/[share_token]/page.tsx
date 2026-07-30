import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import Link from "next/link";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

export default async function ProfileViaSharePage({
  params,
}: {
  params: Promise<{ share_token: string }>;
}) {
  const { share_token } = await params;

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id, user_id, title, event_type")
    .eq("share_token", share_token)
    .single();

  if (!wishlist) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: owner }, { data: sharedWishlists }] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("display_name, avatar_url")
      .eq("id", wishlist.user_id)
      .single(),
    // 비로그인이면 현재 위시리스트만, 로그인이면 공유받은 전체 목록
    user
      ? supabaseAdmin
          .from("wishlists")
          .select("id, title, event_type, share_token")
          .eq("user_id", wishlist.user_id)
          .in(
            "id",
            await (async () => {
              const [{ data: visits }, { data: invites }] = await Promise.all([
                supabaseAdmin
                  .from("wishlist_visits")
                  .select("wishlist_id")
                  .eq("user_id", user.id),
                supabaseAdmin
                  .from("wishlist_invites")
                  .select("wishlist_id")
                  .eq("invitee_email", user.email!)
                  .eq("status", "accepted"),
              ]);
              const ids = [
                ...new Set([
                  ...(visits ?? []).map((v) => v.wishlist_id),
                  ...(invites ?? []).map((i) => i.wishlist_id),
                  wishlist.id,
                ]),
              ];
              return ids;
            })()
          )
          .order("updated_at", { ascending: false })
      : supabaseAdmin
          .from("wishlists")
          .select("id, title, event_type, share_token")
          .eq("id", wishlist.id),
  ]);

  if (!owner) notFound();

  const displayName = owner.display_name ?? "Unknown";
  const initial = displayName[0].toUpperCase();

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
            {owner.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={owner.avatar_url} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {initial}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-lg">{displayName}</p>
            <p className="text-sm text-muted-foreground">
              {(sharedWishlists ?? []).length} shared wishlist{(sharedWishlists ?? []).length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(sharedWishlists ?? []).map((wl) => {
            const emoji = EVENT_EMOJI[wl.event_type] ?? "🎁";
            return (
              <Link
                key={wl.id}
                href={`/share/${wl.share_token}`}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-secondary/40 transition-colors"
              >
                <span className="text-xl">{emoji}</span>
                <span className="font-medium truncate">{wl.title}</span>
              </Link>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground pt-4">
          <Link
            href={`/share/${share_token}`}
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            ← Back to wishlist
          </Link>
        </p>
      </main>
    </AppShell>
  );
}
