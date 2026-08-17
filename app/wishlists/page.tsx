import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WishlistList } from "@/components/wishlist/wishlist-list";
import { ItemSearchBar } from "@/components/wishlist/item-search-bar";
import { AppShell } from "@/components/layout/app-shell";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-yellow-400",
  medium: "bg-blue-400",
  low: "bg-muted-foreground/30",
};

export default async function MyWishlistsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/wishlists");

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (query) {
    const { data: wishlists } = await supabaseAdmin
      .from("wishlists")
      .select("id, title, event_type")
      .eq("user_id", user.id);

    const wishlistIds = (wishlists ?? []).map((w) => w.id);
    const wishlistMap = Object.fromEntries(
      (wishlists ?? []).map((w) => [w.id, w])
    );

    const { data: items } =
      wishlistIds.length > 0
        ? await supabaseAdmin
            .from("wish_items")
            .select("id, wishlist_id, title, image_url, price, currency, store_name, priority")
            .in("wishlist_id", wishlistIds)
            .ilike("title", `%${query}%`)
            .order("created_at", { ascending: false })
            .limit(50)
        : { data: [] as { id: string; wishlist_id: string; title: string; image_url: string | null; price: number | null; currency: string | null; store_name: string | null; priority: string }[] };

    return (
      <AppShell>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">My Wishlists</h1>
            <Link
              href="/wishlist/new"
              className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              + Add
            </Link>
          </div>

          <ItemSearchBar defaultValue={query} />

          <div className="mt-6">
            {(items ?? []).length === 0 ? (
              <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-2">
                <p className="text-4xl">🔍</p>
                <p className="font-medium">No items found for &quot;{query}&quot;</p>
                <p className="text-sm">Try a different keyword.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {items!.length} result{items!.length !== 1 ? "s" : ""} for &quot;{query}&quot;
                </p>
                {items!.map((item) => {
                  const wishlist = wishlistMap[item.wishlist_id];
                  if (!wishlist) return null;
                  const emoji = EVENT_EMOJI[wishlist.event_type] ?? "🎁";
                  return (
                    <div key={item.id} className="rounded-xl border border-border overflow-hidden">
                      <Link
                        href={`/wishlist/${item.wishlist_id}/item/${item.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-lg border border-border bg-secondary flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
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

                      <div className="px-4 py-2 border-t border-border bg-secondary/30">
                        <p className="text-xs text-muted-foreground truncate">
                          {emoji} {wishlist.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">My Wishlists</h1>
          <Link
            href="/wishlist/new"
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            + Add
          </Link>
        </div>
        <div className="space-y-4">
          <ItemSearchBar />
          <WishlistList />
        </div>
      </main>
    </AppShell>
  );
}
