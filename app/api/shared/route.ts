import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LIMIT = 20;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Number(searchParams.get("limit") ?? LIMIT);
  const offset = (page - 1) * limit;

  const [{ data: inviteRows }, { data: visitRows }] = await Promise.all([
    supabaseAdmin
      .from("wishlist_invites")
      .select("wishlist_id")
      .eq("accepted_user_id", user.id)
      .eq("status", "accepted"),
    supabaseAdmin
      .from("wishlist_visits")
      .select("wishlist_id")
      .eq("user_id", user.id),
  ]);

  const allIds = [
    ...new Set([
      ...(inviteRows ?? []).map((r) => r.wishlist_id),
      ...(visitRows ?? []).map((r) => r.wishlist_id),
    ]),
  ];

  if (allIds.length === 0) return NextResponse.json({ items: [], hasMore: false });

  const pagedIds = allIds.slice(offset, offset + limit);
  if (pagedIds.length === 0) return NextResponse.json({ items: [], hasMore: false });

  const { data: wishlists } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, share_token, user_id, event_type")
    .in("id", pagedIds);

  const ownerIds = [...new Set((wishlists ?? []).map((w) => w.user_id))];
  const { data: owners } = await supabaseAdmin
    .from("users")
    .select("id, display_name, email")
    .in("id", ownerIds);

  const ownerMap = Object.fromEntries(
    (owners ?? []).map((o) => [o.id, o.display_name ?? o.email])
  );

  const items = (wishlists ?? []).map((wl) => ({
    id: wl.id,
    title: wl.title,
    share_token: wl.share_token,
    event_type: wl.event_type,
    ownerName: ownerMap[wl.user_id] ?? "Unknown",
  }));

  return NextResponse.json({ items, hasMore: pagedIds.length === limit });
}
