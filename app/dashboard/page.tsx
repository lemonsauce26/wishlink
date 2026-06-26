import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WishlistList } from "@/components/wishlist/wishlist-list";
import { AppHeader } from "@/components/layout/app-header";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">My Wishlists</h1>
          <Link
            href="/wishlist/new"
            className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Add Wishlist
          </Link>
        </div>
        <WishlistList />
      </main>
    </div>
  );
}
