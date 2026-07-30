import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ExploreDetailClient } from "@/components/explore/explore-detail-client";
import { SaveItemButton } from "@/components/explore/save-item-button";
import { EVENT_EMOJI, EVENT_INFOS } from "@/lib/constants/event-infos";
import Link from "next/link";

export default async function ExploreDetailPage({
  params,
}: {
  params: Promise<{ explore_token: string }>;
}) {
  const { explore_token } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, event_type, user_id, event_date")
    .eq("explore_token", explore_token)
    .single();

  if (!wishlist) notFound();

  const [{ data: ownerProfile }, { data: items }, { count: likeCount }, { data: userLike }, { data: stats }] =
    await Promise.all([
      supabaseAdmin
        .from("users")
        .select("nickname, avatar_url")
        .eq("id", wishlist.user_id)
        .single(),
      supabaseAdmin
        .from("wish_items")
        .select("id, title, image_url, price, currency, product_url, store_name")
        .eq("wishlist_id", wishlist.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("wishlist_likes")
        .select("id", { count: "exact", head: true })
        .eq("wishlist_id", wishlist.id),
      user
        ? supabaseAdmin
            .from("wishlist_likes")
            .select("id")
            .eq("wishlist_id", wishlist.id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabaseAdmin
        .from("wishlist_stats")
        .select("copy_count")
        .eq("wishlist_id", wishlist.id)
        .maybeSingle(),
    ]);

  const emoji = EVENT_EMOJI[wishlist.event_type] ?? "🎁";
  const eventLabel = EVENT_INFOS.find((e) => e.value === wishlist.event_type)?.label ?? wishlist.event_type;
  const date = wishlist.event_date
    ? new Date(wishlist.event_date + "T00:00:00").toLocaleDateString("en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const allItems = items ?? [];

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl leading-snug">
            {emoji} {wishlist.title}
          </h1>

          <div className="flex items-center gap-2">
            <Link
              href={`/explore/user/${ownerProfile?.nickname ?? ""}`}
              className="flex items-center gap-2 group"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden bg-secondary border border-border shrink-0">
                {ownerProfile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ownerProfile.avatar_url}
                    alt={ownerProfile.nickname ?? ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                    {(ownerProfile?.nickname ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-foreground group-hover:underline underline-offset-2">
                @{ownerProfile?.nickname || "—"}
              </span>
            </Link>
            <span className="ml-auto text-xs bg-secondary border border-border rounded-full px-2.5 py-1 text-muted-foreground whitespace-nowrap">
              {emoji} {eventLabel}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            {date && `${date} · `}
            {allItems.length} items
          </p>
        </div>

        <ExploreDetailClient
          wishlistId={wishlist.id}
          wishlistTitle={wishlist.title}
          isLoggedIn={!!user}
          initialLiked={!!userLike}
          initialLikeCount={likeCount ?? 0}
          initialCopyCount={stats?.copy_count ?? 0}
        />

        {allItems.length === 0 ? (
          <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">📦</p>
            <p className="font-medium">No items yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border p-4"
              >
                {item.image_url && (
                  <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{item.title}</p>
                  {item.price != null && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.currency} {item.price.toLocaleString()}
                    </p>
                  )}
                  {item.store_name && (
                    item.product_url ? (
                      <a
                        href={item.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:underline mt-0.5 inline-block"
                      >
                        {item.store_name} →
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-0.5">{item.store_name}</p>
                    )
                  )}
                  {!item.store_name && item.product_url && (
                    <a
                      href={item.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:underline mt-0.5 inline-block"
                    >
                      View →
                    </a>
                  )}
                </div>
                <SaveItemButton itemId={item.id} isLoggedIn={!!user} />
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          Made with{" "}
          <Link
            href="/"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            WishLink
          </Link>
        </p>
      </main>
    </AppShell>
  );
}
