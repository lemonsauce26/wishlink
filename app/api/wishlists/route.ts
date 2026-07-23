import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const VALID_SORT = ["created_at", "updated_at", "title", "event_date"] as const;
type SortColumn = (typeof VALID_SORT)[number];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sortParam = searchParams.get("sort") ?? "created_at";
  const sort: SortColumn = VALID_SORT.includes(sortParam as SortColumn) ? (sortParam as SortColumn) : "created_at";
  const ascending = searchParams.get("order") === "asc";

  const { data, error } = await supabaseAdmin
    .from("wishlists")
    .select("id, title, event_type, event_date, visibility")
    .eq("user_id", user.id)
    .order(sort, { ascending, nullsFirst: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, event_type, event_date, visibility, reservation_visibility } = body;

  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("wishlists")
    .insert({ title, event_type, event_date: event_date || null, visibility, reservation_visibility, user_id: user.id, updated_at: now })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id: data.id });
}
