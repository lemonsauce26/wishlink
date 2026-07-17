import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WishItemList } from "@/components/wishlist/wish-item-list";
import { ShareButton } from "@/components/wishlist/share-button";
import { AppHeader } from "@/components/layout/app-header";
import { getReservationCountMap } from "@/lib/reservations";
import { EVENT_EMOJI } from "@/lib/constants/event-infos";

const VISIBILITY_LABEL: Record<string, string> = {
  public: "Public",
  private: "Private",
  inner_circle: "Inner Circle",
};

export default async function WishlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // RLS handles access: owner sees all, others only see public wishlists
  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("*")
    .eq("id", id)
    .single();

  if (!wishlist) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-4xl">🔒</p>
          <p className="font-medium">This wishlist is private</p>
          <p className="text-sm text-muted-foreground">You don't have access to this wishlist.</p>
          <Link
            href="/dashboard"
            className="inline-block mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = wishlist.user_id === user.id;

  const { data: items } = await supabase
    .from("wish_items")
    .select("*")
    .eq("wishlist_id", id)
    .order("created_at", { ascending: false });

  const reservationCountMap = isOwner
    ? await getReservationCountMap((items ?? []).map((i) => i.id))
    : {};

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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {emoji} {wishlist.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {date && `${date} · `}
              {VISIBILITY_LABEL[wishlist.visibility]} · {(items ?? []).length} items
            </p>
          </div>
          {isOwner && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/wishlist/${wishlist.id}/edit`}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Edit
              </Link>
              <ShareButton
                wishlistId={wishlist.id}
                shareToken={wishlist.share_token}
                visibility={wishlist.visibility}
              />
              {wishlist.visibility === "inner_circle" && (
                <Link
                  href={`/wishlist/${wishlist.id}/inner-circle`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Manage Inner Circle
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        {(items ?? []).length === 0 ? (
          <div className="rounded-xl border border-border p-10 text-center text-muted-foreground space-y-3">
            <p className="text-4xl">📦</p>
            <p className="font-medium">No items yet</p>
            {isOwner && (
              <Link
                href={`/wishlist/${wishlist.id}/item/new`}
                className="inline-block mt-1 text-sm font-medium text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Add your first item
              </Link>
            )}
          </div>
        ) : (
          <WishItemList items={items ?? []} wishlistId={wishlist.id} isOwner={isOwner} reservationCountMap={reservationCountMap} reservationVisibility={wishlist.reservation_visibility} />
        )}
      </main>
    </div>
  );
}
