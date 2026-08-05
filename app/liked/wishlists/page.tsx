import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function LikedWishlistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: likedRows } = await supabaseAdmin
    .from("wishlist_likes")
    .select("wishlist_id, liked_at")
    .eq("user_id", user.id)
    .order("liked_at", { ascending: false });

  const wishlistIds = (likedRows ?? []).map((r) => r.wishlist_id);

  const { data: wishlists } =
    wishlistIds.length > 0
      ? await supabaseAdmin
          .from("wishlists")
          .select("id, title, event_type, user_id, explore_token")
          .in("id", wishlistIds)
      : { data: [] as { id: string; title: string; event_type: string; user_id: string; explore_token: string | null }[] };

  const userIds = [...new Set((wishlists ?? []).map((w) => w.user_id))];
  const { data: owners } =
    userIds.length > 0
      ? await supabaseAdmin.from("users").select("id, nickname").in("id", userIds)
      : { data: [] as { id: string; nickname: string }[] };

  const ownerMap = new Map((owners ?? []).map((u) => [u.id, u.nickname]));
  const wishlistMap = new Map((wishlists ?? []).map((w) => [w.id, w]));
  const sorted = (wishlistIds.map((id) => wishlistMap.get(id)).filter(Boolean) as NonNullable<typeof wishlists>);

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <Link
            href="/liked"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Liked
          </Link>
          <h1 className="text-2xl font-semibold">Liked Wishlists</h1>
          <p className="text-sm text-muted-foreground">{sorted.length} wishlists</p>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">🎁</p>
            <p className="font-medium">No liked wishlists yet</p>
            <Link href="/explore" className="text-sm text-emerald-600 hover:underline">
              Browse Explore →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((w) => {
              const emoji = EVENT_EMOJI[w.event_type] ?? "🎁";
              const href = w.explore_token ? `/explore/${w.explore_token}` : null;
              const nickname = ownerMap.get(w.user_id);
              const inner = (
                <div className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 hover:bg-secondary transition-colors">
                  <span className="text-xl shrink-0">{emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{w.title}</p>
                    {nickname && (
                      <p className="text-xs text-muted-foreground mt-0.5">@{nickname}</p>
                    )}
                  </div>
                </div>
              );
              return href ? (
                <Link key={w.id} href={href}>
                  {inner}
                </Link>
              ) : (
                <div key={w.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
