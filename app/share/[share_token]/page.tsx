import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkWishlistAccess } from "@/lib/wishlist-access";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ShareItemList } from "@/components/wishlist/share-item-list";

const EVENT_EMOJI: Record<string, string> = {
  birthday: "🎂",
  mothers_day: "🌸",
  fathers_day: "👨",
  valentines: "💝",
  christmas: "🎄",
  hanukkah: "🕎",
  engagement: "💍",
  bridal_shower: "👰",
  wedding: "🥂",
  anniversary: "🎊",
  baby_shower: "👶",
  graduation: "🎓",
  new_job: "💼",
  retirement: "🌅",
  housewarming: "🏠",
  just_because: "🎉",
};

export default async function SharePage({ params }: { params: { share_token: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const result = await checkWishlistAccess({
    shareToken: params.share_token,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
  });

  if (!result.allowed) {
    if (result.reason === "redirect_login") {
      redirect(`/auth/login?next=/share/${params.share_token}`);
    }
    if (result.reason === "forbidden") {
      return (
        <div className="min-h-screen bg-background">
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

  const { data: items } = await supabaseAdmin
    .from("wish_items")
    .select("*")
    .eq("wishlist_id", wishlist.id);

  const allItems = items ?? [];

  const emoji = EVENT_EMOJI[wishlist.event_type] ?? "🎁";
  const date = wishlist.event_date
    ? new Date(wishlist.event_date + "T00:00:00").toLocaleDateString("en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background">

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
          <ShareItemList items={allItems} />
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
