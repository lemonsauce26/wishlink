import { supabaseAdmin } from "@/lib/supabase/admin";
import { Database } from "@/types/database";

type WishlistRow = Database["public"]["Tables"]["wishlists"]["Row"];

export type WishlistAccessResult =
  | { allowed: true; wishlist: WishlistRow }
  | { allowed: false; reason: "not_found" | "redirect_login" | "forbidden" };

export async function checkWishlistAccess({
  shareToken,
  userId,
  userEmail,
}: {
  shareToken: string;
  userId: string | null;
  userEmail: string | null;
}): Promise<WishlistAccessResult> {
  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("*")
    .eq("share_token", shareToken)
    .single();

  if (!wishlist) return { allowed: false, reason: "not_found" };
  if (wishlist.visibility === "private") return { allowed: false, reason: "not_found" };
  if (wishlist.visibility === "public") return { allowed: true, wishlist };

  // inner_circle
  if (!userId) return { allowed: false, reason: "redirect_login" };
  if (wishlist.user_id === userId) return { allowed: true, wishlist };

  const { data: invite } = await supabaseAdmin
    .from("wishlist_invites")
    .select("id, status")
    .eq("wishlist_id", wishlist.id)
    .eq("invitee_email", userEmail ?? "")
    .neq("status", "cancelled")
    .single();

  if (!invite) return { allowed: false, reason: "forbidden" };

  if (invite.status === "pending") {
    await supabaseAdmin
      .from("wishlist_invites")
      .update({
        status: "accepted",
        accepted_user_id: userId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    supabaseAdmin.from("notifications").insert([
      { user_id: wishlist.user_id, type: "invite_accepted" as const, actor_id: userId, wishlist_id: wishlist.id },
      { user_id: userId, type: "invite_joined" as const, actor_id: wishlist.user_id, wishlist_id: wishlist.id },
    ]).then(({ error }) => {
      if (error) console.error("[notification] invite insert failed:", error);
    });
  }

  return { allowed: true, wishlist };
}
