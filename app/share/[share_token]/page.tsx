import { createClient } from "@/lib/supabase/server";
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

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("*")
    .eq("share_token", params.share_token)
    .single();

  if (!wishlist) notFound();

  if (wishlist.visibility === "private") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-4xl">🔒</p>
          <p className="font-medium">비공개 위시리스트입니다</p>
          <p className="text-sm text-muted-foreground">이 위시리스트는 공개되어 있지 않아요.</p>
        </div>
      </div>
    );
  }

  if (wishlist.visibility === "inner_circle") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/auth/login?next=/share/${params.share_token}`);

    const isOwner = wishlist.user_id === user.id;
    if (!isOwner) {
      const { data: invite } = await supabase
        .from("wishlist_invites")
        .select("id")
        .eq("wishlist_id", wishlist.id)
        .eq("invitee_email", user.email ?? "")
        .single();

      if (!invite) {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-3">
              <p className="text-4xl">✨</p>
              <p className="font-medium">초대받은 분만 볼 수 있어요</p>
              <p className="text-sm text-muted-foreground">위시리스트 주인에게 초대를 요청해봐요.</p>
            </div>
          </div>
        );
      }
    }
  }

  const { data: items } = await supabase
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
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <span className="text-sm font-medium">WishLink</span>
        </div>
      </header>

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
            <p className="font-medium">아직 아이템이 없어요</p>
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
