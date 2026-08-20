import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Bell, Gift, UserPlus, UserMinus, UserCheck, Star, XCircle, Users } from "lucide-react";

type NotificationType = "reservation" | "reservation_cancel" | "following_new" | "following_cancel" | "follower_new" | "following_post" | "invite_accepted";

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  reservation: <Gift className="w-5 h-5 text-emerald-600" />,
  reservation_cancel: <XCircle className="w-5 h-5 text-red-500" />,
  following_new: <UserCheck className="w-5 h-5 text-emerald-600" />,
  following_cancel: <UserMinus className="w-5 h-5 text-muted-foreground" />,
  follower_new: <UserPlus className="w-5 h-5 text-blue-500" />,
  following_post: <Star className="w-5 h-5 text-yellow-500" />,
  invite_accepted: <Users className="w-5 h-5 text-purple-500" />,
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/notifications");

  const { data: notifications } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // 읽음 처리 (fetch 후 update)
  await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  const items = notifications ?? [];

  if (items.length === 0) {
    return (
      <AppShell>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold mb-6">Notifications</h1>
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground space-y-3">
            <Bell className="w-10 h-10 mx-auto opacity-30" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm">We&apos;ll let you know when something happens.</p>
          </div>
        </main>
      </AppShell>
    );
  }

  // 관련 데이터 batch fetch
  const actorIds = [...new Set(items.filter((n) => n.actor_id).map((n) => n.actor_id!))];
  const wishlistIds = [...new Set(items.filter((n) => n.wishlist_id).map((n) => n.wishlist_id!))];
  const itemIds = [...new Set(items.filter((n) => n.wish_item_id).map((n) => n.wish_item_id!))];

  const [actorsRes, wishlistsRes, wishItemsRes] = await Promise.all([
    actorIds.length > 0
      ? supabaseAdmin.from("users").select("id, nickname, avatar_url").in("id", actorIds)
      : { data: [] as { id: string; nickname: string | null; avatar_url: string | null }[] },
    wishlistIds.length > 0
      ? supabaseAdmin.from("wishlists").select("id, title, explore_token").in("id", wishlistIds)
      : { data: [] as { id: string; title: string; explore_token: string | null }[] },
    itemIds.length > 0
      ? supabaseAdmin.from("wish_items").select("id, title, wishlist_id").in("id", itemIds)
      : { data: [] as { id: string; title: string; wishlist_id: string }[] },
  ]);

  const actorMap = Object.fromEntries((actorsRes.data ?? []).map((u) => [u.id, u]));
  const wishlistMap = Object.fromEntries((wishlistsRes.data ?? []).map((w) => [w.id, w]));
  const itemMap = Object.fromEntries((wishItemsRes.data ?? []).map((i) => [i.id, i]));

  function renderText(n: typeof items[number]): { text: React.ReactNode; href: string } {
    const actor = n.actor_id ? actorMap[n.actor_id] : null;
    const wishlist = n.wishlist_id ? wishlistMap[n.wishlist_id] : null;
    const item = n.wish_item_id ? itemMap[n.wish_item_id] : null;
    const itemWishlist = item ? wishlistMap[item.wishlist_id] : null;

    switch (n.type) {
      case "reservation":
        return {
          text: (
            <>
              Someone reserved{" "}
              <span className="font-semibold">{item?.title ?? "an item"}</span>
              {itemWishlist && (
                <> from <span className="font-semibold">{itemWishlist.title}</span></>
              )}
            </>
          ),
          href: item ? `/wishlist/${item.wishlist_id}` : "/wishlists",
        };
      case "reservation_cancel":
        return {
          text: (
            <>
              A reservation for{" "}
              <span className="font-semibold">{item?.title ?? "an item"}</span> was cancelled
            </>
          ),
          href: item ? `/wishlist/${item.wishlist_id}` : "/wishlists",
        };
      case "following_new":
        return {
          text: (
            <>
              You started following <span className="font-semibold">@{actor?.nickname ?? "someone"}</span>!
            </>
          ),
          href: actor?.nickname ? `/explore/user/${actor.nickname}` : "/explore",
        };
      case "following_cancel":
        return {
          text: (
            <>
              You unfollowed <span className="font-semibold">@{actor?.nickname ?? "someone"}</span>.
            </>
          ),
          href: actor?.nickname ? `/explore/user/${actor.nickname}` : "/explore",
        };
      case "follower_new":
        return {
          text: (
            <>
              <span className="font-semibold">@{actor?.nickname ?? "Someone"}</span> started following you
            </>
          ),
          href: actor?.nickname ? `/explore/user/${actor.nickname}` : "/following",
        };
      case "following_post":
        return {
          text: (
            <>
              <span className="font-semibold">@{actor?.nickname ?? "Someone"}</span> posted a new wishlist
              {wishlist && (
                <>: <span className="font-semibold">{wishlist.title}</span></>
              )}
            </>
          ),
          href: wishlist?.explore_token ? `/explore/${wishlist.explore_token}` : "/explore",
        };
      case "invite_accepted":
        return {
          text: (
            <>
              <span className="font-semibold">@{actor?.nickname ?? "Someone"}</span> accepted your Inner Circle invite
              {wishlist && (
                <> for <span className="font-semibold">{wishlist.title}</span></>
              )}
            </>
          ),
          href: wishlist ? `/wishlist/${wishlist.id}/inner-circle` : "/wishlists",
        };
    }
  }

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-6">Notifications</h1>

        <div className="rounded-2xl border border-border overflow-hidden divide-y divide-border">
          {items.map((n) => {
            const { text, href } = renderText(n);
            const wasUnread = !n.read;
            return (
              <Link
                key={n.id}
                href={href}
                className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors relative"
              >
                {wasUnread && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600 rounded-r-full" />
                )}
                <div className="mt-0.5 shrink-0">
                  {TYPE_ICON[n.type as NotificationType]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{text}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {formatRelativeTime(n.created_at)}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
