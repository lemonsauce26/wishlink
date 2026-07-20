import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-yellow-400",
  medium: "bg-blue-400",
  low: "bg-muted-foreground/30",
};

export default async function ReservationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/reservations");

  const { data: reservations } = await supabaseAdmin
    .from("wishitem_reservations")
    .select("id, wish_item_id, reserved_at, cancel_token")
    .eq("user_id", user.id)
    .eq("reserved_by_owner", false)
    .is("cancelled_at", null)
    .order("reserved_at", { ascending: false });

  if (!reservations || reservations.length === 0) {
    return (
      <AppShell>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold mb-6">My Reservations</h1>
          <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">🎁</p>
            <p className="font-medium">No reservations yet</p>
            <p className="text-sm">
              Items you&apos;ve reserved from others&apos; wishlists will appear here.
            </p>
          </div>
        </main>
      </AppShell>
    );
  }

  const itemIds = reservations.map((r) => r.wish_item_id);

  const { data: items } = await supabaseAdmin
    .from("wish_items")
    .select("id, wishlist_id, title, image_url, price, currency, store_name, priority")
    .in("id", itemIds);

  const wishlistIds = [...new Set((items ?? []).map((i) => i.wishlist_id))];

  const { data: wishlists } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, share_token, user_id")
    .in("id", wishlistIds);

  const ownerIds = [...new Set((wishlists ?? []).map((w) => w.user_id))];

  const { data: owners } = await supabaseAdmin
    .from("users")
    .select("id, display_name, email")
    .in("id", ownerIds);

  const itemMap = Object.fromEntries((items ?? []).map((i) => [i.id, i]));
  const wishlistMap = Object.fromEntries((wishlists ?? []).map((w) => [w.id, w]));
  const ownerMap = Object.fromEntries(
    (owners ?? []).map((o) => [o.id, o.display_name ?? o.email])
  );

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">My Reservations</h1>

        <div className="space-y-3">
          {reservations.map((r) => {
            const item = itemMap[r.wish_item_id];
            const wishlist = item ? wishlistMap[item.wishlist_id] : null;
            const ownerName = wishlist ? ownerMap[wishlist.user_id] : null;
            if (!item || !wishlist) return null;

            return (
              <div key={r.id} className="rounded-xl border border-border overflow-hidden">
                <Link
                  href={`/share/${wishlist.share_token}`}
                  className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg border border-border bg-secondary flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🎁
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.price != null && (
                        <span className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} {item.currency}
                        </span>
                      )}
                      {item.store_name && (
                        <span className="text-xs text-muted-foreground">
                          · {item.store_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[item.priority] ?? "bg-muted-foreground/30"}`}
                  />
                </Link>

                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/30 gap-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {ownerName && `${ownerName}의 `}
                    {wishlist.title}
                  </p>
                  {r.cancel_token && (
                    <Link
                      href={`/reservations/cancel/${r.cancel_token}`}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      Cancel
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
