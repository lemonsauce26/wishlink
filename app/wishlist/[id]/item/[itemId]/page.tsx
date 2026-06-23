import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { WishItemDetail } from "@/components/wishlist/wish-item-detail";

export default async function ItemDetailPage({
  params,
}: {
  params: { id: string; itemId: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: item } = await supabase
    .from("wish_items")
    .select("*")
    .eq("id", params.itemId)
    .eq("wishlist_id", params.id)
    .single();

  if (!item) notFound();

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, title, user_id")
    .eq("id", params.id)
    .single();

  if (!wishlist) notFound();

  const isOwner = wishlist.user_id === user.id;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link
            href={`/wishlist/${params.id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {wishlist.title}
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <WishItemDetail item={item} wishlistId={params.id} isOwner={isOwner} />
      </main>
    </div>
  );
}
