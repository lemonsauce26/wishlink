import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type NotificationType =
  | "reservation" | "reservation_cancel"
  | "following_new" | "following_cancel" | "follower_new" | "following_post"
  | "invite_accepted" | "invite_joined" | "invite_received"
  | "wishlist_liked" | "wishitem_liked" | "wishlist_copied" | "wishitem_saved";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: notifications } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const items = notifications ?? [];
  if (items.length === 0) return NextResponse.json({ notifications: [] });

  const actorIds = [...new Set(items.filter(n => n.actor_id).map(n => n.actor_id!))];
  const wishlistIds = [...new Set(items.filter(n => n.wishlist_id).map(n => n.wishlist_id!))];
  const itemIds = [...new Set(items.filter(n => n.wish_item_id).map(n => n.wish_item_id!))];

  const [actorsRes, wishlistsRes, wishItemsRes] = await Promise.all([
    actorIds.length > 0
      ? supabaseAdmin.from("users").select("id, nickname").in("id", actorIds)
      : { data: [] as { id: string; nickname: string | null }[] },
    wishlistIds.length > 0
      ? supabaseAdmin.from("wishlists").select("id, title, explore_token, share_token").in("id", wishlistIds)
      : { data: [] as { id: string; title: string; explore_token: string | null; share_token: string }[] },
    itemIds.length > 0
      ? supabaseAdmin.from("wish_items").select("id, title, wishlist_id").in("id", itemIds)
      : { data: [] as { id: string; title: string; wishlist_id: string }[] },
  ]);

  const actorMap = Object.fromEntries((actorsRes.data ?? []).map(u => [u.id, u]));
  const wishlistMap = Object.fromEntries((wishlistsRes.data ?? []).map(w => [w.id, w]));
  const itemMap = Object.fromEntries((wishItemsRes.data ?? []).map(i => [i.id, i]));

  const result = items.map(n => {
    const actor = n.actor_id ? actorMap[n.actor_id] : null;
    const wishlist = n.wishlist_id ? wishlistMap[n.wishlist_id] : null;
    const item = n.wish_item_id ? itemMap[n.wish_item_id] : null;
    const itemWishlist = item ? wishlistMap[item.wishlist_id] : null;

    let text = "";
    let href = "/notifications";

    switch (n.type as NotificationType) {
      case "reservation":
        text = `Someone reserved ${item?.title ?? "an item"}${itemWishlist ? ` from ${itemWishlist.title}` : ""}`;
        href = item ? `/wishlist/${item.wishlist_id}` : "/wishlists";
        break;
      case "reservation_cancel":
        text = `A reservation for ${item?.title ?? "an item"} was cancelled`;
        href = item ? `/wishlist/${item.wishlist_id}` : "/wishlists";
        break;
      case "following_new":
        text = `You started following @${actor?.nickname ?? "someone"}`;
        href = actor?.nickname ? `/explore/user/${actor.nickname}` : "/explore";
        break;
      case "following_cancel":
        text = `You unfollowed @${actor?.nickname ?? "someone"}`;
        href = actor?.nickname ? `/explore/user/${actor.nickname}` : "/explore";
        break;
      case "follower_new":
        text = `@${actor?.nickname ?? "Someone"} started following you`;
        href = actor?.nickname ? `/explore/user/${actor.nickname}` : "/explore";
        break;
      case "following_post":
        text = `@${actor?.nickname ?? "Someone"} posted a new wishlist${wishlist ? `: ${wishlist.title}` : ""}`;
        href = wishlist?.explore_token ? `/explore/${wishlist.explore_token}` : "/explore";
        break;
      case "invite_accepted":
        text = `@${actor?.nickname ?? "Someone"} accepted your Inner Circle invite${wishlist ? ` for ${wishlist.title}` : ""}`;
        href = wishlist ? `/wishlist/${wishlist.id}/inner-circle` : "/wishlists";
        break;
      case "invite_joined":
        text = `You joined @${actor?.nickname ?? "someone"}'s Inner Circle${wishlist ? ` for ${wishlist.title}` : ""}`;
        href = wishlist?.share_token ? `/share/${wishlist.share_token}` : "/wishlists";
        break;
      case "invite_received":
        text = `You've been invited to @${actor?.nickname ?? "someone"}'s Inner Circle${wishlist ? ` for ${wishlist.title}` : ""}`;
        href = wishlist?.share_token ? `/share/${wishlist.share_token}` : "/wishlists";
        break;
      case "wishlist_liked":
        text = `@${actor?.nickname ?? "Someone"} liked your wishlist${wishlist ? ` ${wishlist.title}` : ""}`;
        href = wishlist?.explore_token ? `/explore/${wishlist.explore_token}` : "/wishlists";
        break;
      case "wishitem_liked":
        text = `@${actor?.nickname ?? "Someone"} liked your item${item ? ` ${item.title}` : ""}${itemWishlist ? ` from ${itemWishlist.title}` : ""}`;
        href = item ? `/wishlist/${item.wishlist_id}` : "/wishlists";
        break;
      case "wishlist_copied":
        text = `@${actor?.nickname ?? "Someone"} copied your wishlist${wishlist ? ` ${wishlist.title}` : ""}`;
        href = wishlist ? `/wishlist/${wishlist.id}` : "/wishlists";
        break;
      case "wishitem_saved":
        text = `@${actor?.nickname ?? "Someone"} saved your item${item ? ` ${item.title}` : ""}${itemWishlist ? ` from ${itemWishlist.title}` : ""}`;
        href = item ? `/wishlist/${item.wishlist_id}` : "/wishlists";
        break;
    }

    return { id: n.id, type: n.type, read: n.read, created_at: n.created_at, text, href };
  });

  return NextResponse.json({ notifications: result });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await supabaseAdmin
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ success: true });
}
