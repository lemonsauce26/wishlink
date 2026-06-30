import { supabaseAdmin } from "@/lib/supabase/admin";
import { Database } from "@/types/database";

export type ClaimRow = Database["public"]["Tables"]["wishitem_claims"]["Row"];

export async function getClaimCount(wishItemId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("wishitem_claims")
    .select("id", { count: "exact", head: true })
    .eq("wish_item_id", wishItemId)
    .is("cancelled_at", null);
  return count ?? 0;
}

export async function getActiveClaims(wishItemId: string): Promise<ClaimRow[]> {
  const { data } = await supabaseAdmin
    .from("wishitem_claims")
    .select("*")
    .eq("wish_item_id", wishItemId)
    .is("cancelled_at", null)
    .order("claimed_at", { ascending: true });
  return data ?? [];
}

export async function getClaimCountMap(wishItemIds: string[]): Promise<Record<string, number>> {
  if (wishItemIds.length === 0) return {};
  const { data } = await supabaseAdmin
    .from("wishitem_claims")
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
