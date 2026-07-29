import { supabaseAdmin } from "@/lib/supabase/admin";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const TOKEN_LENGTH = 10;

function generateRandom(): string {
  let result = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

export async function generateUniqueToken(
  column: "share_token" | "explore_token"
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const token = generateRandom();
    const { data } = await supabaseAdmin
      .from("wishlists")
      .select("id")
      .eq(column, token)
      .maybeSingle();
    if (!data) return token;
  }
  throw new Error(`Failed to generate unique ${column} after 10 attempts`);
}
