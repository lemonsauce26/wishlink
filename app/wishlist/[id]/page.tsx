import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function WishlistDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!wishlist) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← My Wishlists
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{wishlist.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{wishlist.visibility} · {wishlist.event_type}</p>
          </div>
          <Link
            href={`/wishlist/${wishlist.id}/edit`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
          >
            Edit
          </Link>
        </div>

        <div className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium">No items yet</p>
          <p className="text-sm mt-1">Add Item feature coming soon.</p>
        </div>
      </main>
    </div>
  );
}
