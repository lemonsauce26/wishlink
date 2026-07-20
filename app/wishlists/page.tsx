import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WishlistList } from "@/components/wishlist/wishlist-list";
import { AppShell } from "@/components/layout/app-shell";

export default async function MyWishlistsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/wishlists");

  return (
    <AppShell>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">My Wishlists</h1>
          <Link
            href="/wishlist/new"
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            + Add
          </Link>
        </div>
        <WishlistList />
      </main>
    </AppShell>
  );
}
