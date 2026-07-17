import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { WishItemDetail } from "@/components/wishlist/wish-item-detail";
import { AppHeader } from "@/components/layout/app-header";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  const { id, itemId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: item } = await supabase
    .from("wish_items")
    .select("*")
    .eq("id", itemId)
    .eq("wishlist_id", id)
    .single();

  if (!item) notFound();

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, title, user_id")
    .eq("id", id)
    .single();

  if (!wishlist) notFound();

  const isOwner = wishlist.user_id === user.id;

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <WishItemDetail item={item} wishlistId={id} isOwner={isOwner} />
      </main>
    </div>
  );
}
