import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SharedListClient, type SharedWishlistItem } from "@/components/shared/shared-list-client";

const LIMIT = 20;

export default async function SharedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/shared");

  const [{ data: inviteRows }, { data: visitRows }] = await Promise.all([
    supabaseAdmin
      .from("wishlist_invites")
      .select("wishlist_id")
      .eq("accepted_user_id", user.id)
      .eq("status", "accepted"),
    supabaseAdmin
      .from("wishlist_visits")
      .select("wishlist_id")
      .eq("user_id", user.id),
  ]);

  const allIds = [
    ...new Set([
      ...(inviteRows ?? []).map((r) => r.wishlist_id),
      ...(visitRows ?? []).map((r) => r.wishlist_id),
    ]),
  ];

  const emptyState = (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Shared</h1>
        <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
          <p className="text-4xl">💝</p>
          <p className="font-medium">No wishlists yet</p>
          <p className="text-sm">
            Wishlists shared with you or public ones you&apos;ve visited will appear here.
          </p>
        </div>
      </main>
    </AppShell>
  );

  if (allIds.length === 0) return emptyState;

  const pagedIds = allIds.slice(0, LIMIT);
  const { data: wishlists } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, share_token, user_id, event_type")
    .in("id", pagedIds);

  if (!wishlists || wishlists.length === 0) return emptyState;

  const ownerIds = [...new Set(wishlists.map((w) => w.user_id))];
  const { data: owners } = await supabaseAdmin
    .from("users")
    .select("id, display_name, email")
    .in("id", ownerIds);

  const ownerMap = Object.fromEntries(
    (owners ?? []).map((o) => [o.id, o.display_name ?? o.email])
  );

  const initialItems: SharedWishlistItem[] = wishlists.map((wl) => ({
    id: wl.id,
    title: wl.title,
    share_token: wl.share_token,
    event_type: wl.event_type,
    ownerName: ownerMap[wl.user_id] ?? "Unknown",
  }));

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Shared</h1>
        <SharedListClient initialItems={initialItems} />
      </main>
    </AppShell>
  );
}
