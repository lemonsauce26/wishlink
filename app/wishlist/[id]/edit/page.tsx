import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { WishlistForm } from "@/components/wishlist/wishlist-form";
import { AppHeader } from "@/components/layout/app-header";

export default async function EditWishlistPage({ params }: { params: { id: string } }) {
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
      <AppHeader />

      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Wishlist</h1>
        </div>
        <WishlistForm
          mode="edit"
          wishlistId={wishlist.id}
          defaultValues={{
            title: wishlist.title,
            event_type: wishlist.event_type,
            event_date: wishlist.event_date ?? "",
            visibility: wishlist.visibility,
            claim_visibility: wishlist.claim_visibility,
          }}
        />
      </div>
    </div>
  );
}
