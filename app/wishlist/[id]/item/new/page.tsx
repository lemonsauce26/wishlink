import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { WishItemForm } from "@/components/wishlist/wish-item-form";
import { AppHeader } from "@/components/layout/app-header";

export default async function NewItemPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { title?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, title")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!wishlist) notFound();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Add Item</h1>
        <WishItemForm
          mode="create"
          wishlistId={params.id}
          defaultValues={searchParams.title ? { title: searchParams.title } : undefined}
        />
      </main>
    </div>
  );
}
