import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkWishlistAccess } from "@/lib/wishlist-access";
import { getReservationCountMap } from "@/lib/reservations";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ShareItemList } from "@/components/wishlist/share-item-list";
import { AppHeader } from "@/components/layout/app-header";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

export default async function SharePage({ params }: { params: Promise<{ share_token: string }> }) {
  const { share_token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await checkWishlistAccess({
    shareToken: share_token,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
  });

  if (!result.allowed) {
    if (result.reason === "redirect_login") {
      redirect(`/auth/login?next=/share/${share_token}`);
    }
    if (result.reason === "forbidden") {
      return (
        <div className="min-h-dvh bg-background">
          <AppHeader />
          <main className="max-w-4xl mx-auto px-4 py-24 text-center space-y-3">
            <p className="text-4xl">🔍</p>
            <p className="font-medium">This page is not available</p>
            <p className="text-sm text-muted-foreground">
              This page is currently not available.
            </p>
          </main>
        </div>
      );
    }
    notFound();
  }

  const wishlist = result.wishlist;
  const isOwner = wishlist.user_id === user?.id;

  if (user && !isOwner && wishlist.visibility === "public") {
    await supabaseAdmin
      .from("wishlist_visits")
      .upsert(
        { wishlist_id: wishlist.id, user_id: user.id },
        { onConflict: "wishlist_id,user_id", ignoreDuplicates: true }
      );
  }

  const { data: items } = await supabaseAdmin
    .from("wish_items")
    .select("*")
    .eq("wishlist_id", wishlist.id)
    .order("created_at", { ascending: false });

  const allItems = items ?? [];
  const itemIds = allItems.map((i) => i.id);

  const reservationCountMap = await getReservationCountMap(itemIds);

  const myReservationMap: Record<string, string> = {};
  if (user && !isOwner && itemIds.length > 0) {
    const { data: myReservations } = await supabaseAdmin
      .from("wishitem_reservations")
      .select("id, wish_item_id")
      .in("wish_item_id", itemIds)
      .eq("user_id", user.id)
      .is("cancelled_at", null);
    for (const r of myReservations ?? []) {
      myReservationMap[r.wish_item_id] = r.id;
    }
  }

  let currentUser: { name: string; email: string } | null = null;
  let ownerProfile: { display_name: string | null; avatar_url: string | null } | null = null;

  const fetches: Promise<void>[] = [];

  if (user) {
    fetches.push(
      supabaseAdmin
        .from("users")
        .select("display_name, email")
        .eq("id", user.id)
        .single()
        .then(({ data: profile }) => {
          currentUser = {
            name: profile?.display_name ?? profile?.email ?? user.email!,
            email: profile?.email ?? user.email!,
          };
        })
    );
  }

  if (!isOwner) {
    fetches.push(
      supabaseAdmin
        .from("users")
        .select("display_name, avatar_url")
        .eq("id", wishlist.user_id)
        .single()
        .then(({ data }) => {
          ownerProfile = data;
        })
    );
  }

  await Promise.all(fetches);

  const emoji = EVENT_EMOJI[wishlist.event_type] ?? "🎁";
  const date = wishlist.event_date
    ? new Date(wishlist.event_date + "T00:00:00").toLocaleDateString("en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            {emoji} {wishlist.title}
          </h1>
          {ownerProfile && (
            <Link
              href={`/profile/via/${share_token}`}
              className="inline-flex items-center gap-2 group"
            >
              <div
                className="rounded-full overflow-hidden bg-secondary border border-border shrink-0"
                style={{ width: 28, height: 28 }}
              >
                {ownerProfile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ownerProfile.avatar_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                    {(ownerProfile.display_name ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-foreground group-hover:underline underline-offset-2">
                {ownerProfile.display_name ?? "Unknown"}
              </span>
            </Link>
          )}
          <p className="text-sm text-muted-foreground">
            {date && `${date} · `}
            {allItems.length} items
          </p>
        </div>

        {allItems.length === 0 ? (
          <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">📦</p>
            <p className="font-medium">No items yet</p>
          </div>
        ) : (
          <ShareItemList
            items={allItems}
            reservationCountMap={reservationCountMap}
            reservationVisibility={wishlist.reservation_visibility}
            isOwner={isOwner}
            myReservationMap={myReservationMap}
            shareToken={share_token}
            currentUser={currentUser}
          />
        )}

        <p className="text-center text-xs text-muted-foreground pt-4">
          Made with{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-foreground transition-colors">
            WishLink
          </Link>
        </p>
      </main>
    </div>
  );
}
