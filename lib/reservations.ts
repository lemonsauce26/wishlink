import { supabaseAdmin } from "@/lib/supabase/admin";
import { Database } from "@/types/database";

export type ReservationRow = Database["public"]["Tables"]["wishitem_reservations"]["Row"];

export async function getReservationCount(wishItemId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("wishitem_reservations")
    .select("id", { count: "exact", head: true })
    .eq("wish_item_id", wishItemId)
    .is("cancelled_at", null);
  return count ?? 0;
}

export async function getActiveReservations(wishItemId: string): Promise<ReservationRow[]> {
  const { data } = await supabaseAdmin
    .from("wishitem_reservations")
    .select("*")
    .eq("wish_item_id", wishItemId)
    .is("cancelled_at", null)
    .order("reserved_at", { ascending: true });
  return data ?? [];
}

export async function getReservationCountMap(wishItemIds: string[]): Promise<Record<string, number>> {
  if (wishItemIds.length === 0) return {};
  const { data } = await supabaseAdmin
    .from("wishitem_reservations")
    .select("wish_item_id")
    .in("wish_item_id", wishItemIds)
    .is("cancelled_at", null);

  const map: Record<string, number> = {};
  for (const id of wishItemIds) map[id] = 0;
  for (const row of data ?? []) {
    map[row.wish_item_id] = (map[row.wish_item_id] ?? 0) + 1;
  }
  return map;
}
