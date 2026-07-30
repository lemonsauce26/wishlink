import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { WishItemForm } from "@/components/wishlist/wish-item-form";
import { AppShell } from "@/components/layout/app-shell";

export default async function NewItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ title?: string }>;
}) {
  const { id } = await params;
  const { title: queryTitle } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, title")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!wishlist) notFound();

  return (
    <AppShell>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Add Item</h1>
        <WishItemForm
          mode="create"
          wishlistId={id}
          defaultValues={queryTitle ? { title: queryTitle } : undefined}
        />
      </main>
    </AppShell>
  );
}
