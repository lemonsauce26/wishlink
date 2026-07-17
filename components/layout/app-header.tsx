import { createClient } from "@/lib/supabase/server";
import { HeaderUserMenu } from "@/components/layout/header-user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import Link from "next/link";

export async function AppHeader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? user.email ?? null;
  }

  return (
    <header className="border-b border-border">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link href="/dashboard" className="text-sm font-medium">WishLink</Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <HeaderUserMenu displayName={displayName ?? ""} />
          ) : (
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
