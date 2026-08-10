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

  const { data: follows } = await supabaseAdmin
    .from("follows")
    .select("followee_id")
    .eq("follower_id", user.id);

  const followeeIds = (follows ?? []).map((f) => f.followee_id);
  if (followeeIds.length === 0) return NextResponse.json({ items: [], hasMore: false });

  const pagedIds = followeeIds.slice(offset, offset + limit);
  if (pagedIds.length === 0) return NextResponse.json({ items: [], hasMore: false });

  const [{ data: users }, { data: followerCounts }] = await Promise.all([
    supabaseAdmin.from("users").select("id, nickname, avatar_url").in("id", pagedIds),
    supabaseAdmin.from("follows").select("followee_id").in("followee_id", pagedIds),
  ]);

  const countMap: Record<string, number> = {};
  for (const row of followerCounts ?? []) {
    countMap[row.followee_id] = (countMap[row.followee_id] ?? 0) + 1;
  }

  const items = (users ?? []).map((u) => ({
    id: u.id,
    nickname: u.nickname ?? "",
    avatar_url: u.avatar_url,
    followerCount: countMap[u.id] ?? 0,
  }));

  return NextResponse.json({ items, hasMore: pagedIds.length === limit });
}
