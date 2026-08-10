import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LikedWishlistsClient, type LikedWishlistItem } from "@/components/liked/liked-wishlists-client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const LIMIT = 20;

export default async function LikedWishlistsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: likedRows } = await supabaseAdmin
    .from("wishlist_likes")
    .select("wishlist_id")
    .eq("user_id", user.id)
    .order("liked_at", { ascending: false })
    .range(0, LIMIT - 1);

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

  const initialItems: LikedWishlistItem[] = wishlistIds
    .map((id) => wishlistMap.get(id))
    .filter(Boolean)
    .map((w) => ({
      id: w!.id,
      title: w!.title,
      event_type: w!.event_type,
      explore_token: w!.explore_token,
      nickname: ownerMap.get(w!.user_id) ?? null,
    }));

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
        </div>
        <LikedWishlistsClient initialItems={initialItems} />
      </main>
    </AppShell>
  );
}
