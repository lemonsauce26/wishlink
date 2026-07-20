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
      .from("wishlist_follows")
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
  if (user) {
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("display_name, email")
      .eq("id", user.id)
      .single();
    currentUser = {
      name: profile?.display_name ?? profile?.email ?? user.email!,
      email: profile?.email ?? user.email!,
    };
  }

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
        <div>
          <h1 className="text-2xl font-bold">
            {emoji} {wishlist.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
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
