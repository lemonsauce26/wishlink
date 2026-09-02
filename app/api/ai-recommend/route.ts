import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EVENT_LABEL: Record<string, string> = {
  birthday: "Birthday",
  mothers_day: "Mother's Day",
  fathers_day: "Father's Day",
  valentines: "Valentine's Day",
  christmas: "Christmas",
  hanukkah: "Hanukkah",
  engagement: "Engagement",
  bridal_shower: "Bridal Shower",
  wedding: "Wedding",
  anniversary: "Anniversary",
  baby_shower: "Baby Shower",
  graduation: "Graduation",
  new_job: "New Job",
  retirement: "Retirement",
  housewarming: "Housewarming",
  just_because: "Just Because",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wishlistId, excludedItems } = await req.json();
  if (!wishlistId) return NextResponse.json({ error: "wishlistId required" }, { status: 400 });

  const [{ data: wishlist }, { data: userProfile }] = await Promise.all([
    supabase
      .from("wishlists")
      .select("title, event_type, user_id")
      .eq("id", wishlistId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("users")
      .select("age_group, gender")
      .eq("id", user.id)
      .single(),
  ]);

  if (!wishlist) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: items } = await supabase
    .from("wish_items")
    .select("title")
    .eq("wishlist_id", wishlistId);

  const existingItems = (items ?? []).map((i) => i.title);
  const eventLabel = EVENT_LABEL[wishlist.event_type] ?? wishlist.event_type;

  const prompt = [
    `You are a gift recommendation assistant for WishLink, targeting Canadian and North American users.`,
    ``,
    `Wishlist: "${wishlist.title}" (${eventLabel})`,
    ...(userProfile?.age_group || userProfile?.gender
      ? [`Wishlist owner: ${[userProfile.age_group, userProfile.gender].filter(Boolean).join(", ")}`]
      : []),
    existingItems.length > 0
      ? `Already on the wishlist: ${existingItems.map((t) => `"${t}"`).join(", ")}`
      : `No items yet.`,
    ``,
    `Recommend exactly 10 thoughtful, specific gift ideas that complement this wishlist.`,
    `Avoid duplicating existing items. Keep names short (3-5 words max).`,
    ``,
    ...(excludedItems?.length > 0
      ? [`The user strongly dislikes these — do not suggest them or similar items: ${excludedItems.map((i: string) => `"${i}"`).join(", ")}`]
      : []),
    ``,
    `Return ONLY a valid JSON array, no markdown, no explanation:`,
    `[{"name":"...","description":"One sentence about why this is a great gift.","searchQuery":"short search terms"}]`,
  ].join("\n");

  let raw = "";
  try {
    const completion = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    });
    raw = completion.choices[0]?.message?.content ?? "";
  } catch (e) {
    console.error("[ai-recommend] Groq error:", e);
    return NextResponse.json({ error: "AI request failed", detail: String(e) }, { status: 500 });
  }

  const text = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  let recommendations: { name: string; description: string; searchQuery: string }[] = [];
  try {
    recommendations = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json({ recommendations });
}
