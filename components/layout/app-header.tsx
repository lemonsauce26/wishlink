import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { HeaderUserMenu } from "@/components/layout/header-user-menu";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { MobileNav } from "@/components/layout/mobile-side-nav";
import Link from "next/link";

export async function AppHeader({ badge, mobileNavVariant }: { badge?: string; mobileNavVariant?: string } = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let avatarUrl: string | null = null;
  let unreadCount = 0;
  if (user) {
    const [profileResult, unreadResult] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single(),
      supabaseAdmin
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),
    ]);
    displayName = profileResult.data?.display_name ?? user.email ?? null;
    avatarUrl = profileResult.data?.avatar_url ?? null;
    unreadCount = unreadResult.count ?? 0;
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:w-56 px-4 shrink-0">
          <MobileNav variant={mobileNavVariant} />
          <Link href="/dashboard" className="text-sm font-medium">WishLink</Link>
          {badge && (
            <span className="text-xs font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center px-4">
          {user && <NotificationDropdown unreadCount={unreadCount} />}
          {user ? (
            <HeaderUserMenu displayName={displayName ?? ""} avatarUrl={avatarUrl} />
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
