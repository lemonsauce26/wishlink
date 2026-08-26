import { supabaseAdmin } from "@/lib/supabase/admin";

const THRESHOLDS = [
  { days: 7, type: "event_reminder_7" as const },
  { days: 3, type: "event_reminder_3" as const },
  { days: 0, type: "event_reminder_0" as const },
];

function getTargetDate(baseDate: Date, daysAhead: number): string {
  const d = new Date(baseDate);
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

export async function runEventReminders() {
  const now = new Date();

  for (const { days, type } of THRESHOLDS) {
    const targetDate = getTargetDate(now, days);
    console.log(`[event-reminder] ${type} → targetDate: ${targetDate}`);

    const { data: wishlists } = await supabaseAdmin
      .from("wishlists")
      .select("id, user_id, share_token")
      .eq("event_date", targetDate);

    console.log(`[event-reminder] ${type} → wishlists found: ${wishlists?.length ?? 0}`);
    if (!wishlists?.length) continue;

    for (const wishlist of wishlists) {
      const { data: invites } = await supabaseAdmin
        .from("wishlist_invites")
        .select("accepted_user_id")
        .eq("wishlist_id", wishlist.id)
        .eq("status", "accepted")
        .not("accepted_user_id", "is", null);

      console.log(`[event-reminder] wishlist ${wishlist.id} → accepted invites: ${invites?.length ?? 0}`);
      if (!invites?.length) continue;

      const memberIds = invites.map((i) => i.accepted_user_id!);

      const { data: items } = await supabaseAdmin
        .from("wish_items")
        .select("id")
        .eq("wishlist_id", wishlist.id);

      console.log(`[event-reminder] wishlist ${wishlist.id} → wish items: ${items?.length ?? 0}`);

      let unreservedIds = memberIds;

      if (items?.length) {
        const itemIds = items.map((i) => i.id);
        const { data: reservations } = await supabaseAdmin
          .from("wishitem_reservations")
          .select("user_id")
          .in("wish_item_id", itemIds)
          .in("user_id", memberIds)
          .is("cancelled_at", null)
          .not("user_id", "is", null);

        const reservedUserIds = new Set(reservations?.map((r) => r.user_id!) ?? []);
        unreservedIds = memberIds.filter((id) => !reservedUserIds.has(id));
      }
      console.log(`[event-reminder] wishlist ${wishlist.id} → unreserved members: ${unreservedIds.length}`);
      if (!unreservedIds.length) continue;

      const { data: existing } = await supabaseAdmin
        .from("notifications")
        .select("user_id")
        .eq("wishlist_id", wishlist.id)
        .eq("type", type)
        .in("user_id", unreservedIds);

      const alreadyNotified = new Set(existing?.map((n) => n.user_id) ?? []);
      const toNotify = unreservedIds.filter((id) => !alreadyNotified.has(id));
      console.log(`[event-reminder] wishlist ${wishlist.id} → to notify: ${toNotify.length}`);
      if (!toNotify.length) continue;

      const { error: insertError } = await supabaseAdmin.from("notifications").insert(
        toNotify.map((userId) => ({
          user_id: userId,
          type,
          actor_id: wishlist.user_id,
          wishlist_id: wishlist.id,
        }))
      );
      if (insertError) {
        console.error(`[event-reminder] insert failed:`, insertError);
      } else {
        console.log(`[event-reminder] inserted ${toNotify.length} notifications (${type})`);
      }
    }
  }
}
