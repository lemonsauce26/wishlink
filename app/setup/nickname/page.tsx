import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { NicknameSetupClient } from "./nickname-setup-client";

export default async function NicknameSetupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("nickname, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.nickname) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-2xl font-bold">Hey{profile?.display_name ? `, ${profile.display_name}` : ""}! 👋</h1>
          <p className="text-base font-medium">Welcome to WishLink 🎁</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Almost there! Just one thing —<br />
            pick a nickname that people will see<br />
            when you share your wishlists.
          </p>
        </div>

        <NicknameSetupClient />
      </div>
    </div>
  );
}
