import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { wishlistId, ...payload } = body;

  const { data: wishlist } = await supabaseAdmin
    .from("wishlists")
    .select("id")
    .eq("id", wishlistId)
    .eq("user_id", user.id)
    .single();

  if (!wishlist) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabaseAdmin
    .from("wish_items")
    .insert({ ...payload, wishlist_id: wishlistId });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
