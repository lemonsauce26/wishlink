import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { AiRecommendClient } from "@/components/wishlist/ai-recommend-client";
import { AppShell } from "@/components/layout/app-shell";

export default async function RecommendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">✨ AI Gift Ideas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized suggestions based on your wishlist
          </p>
        </div>

        <AiRecommendClient wishlistId={id} wishlistTitle={wishlist.title} />
      </main>
    </AppShell>
  );
}
