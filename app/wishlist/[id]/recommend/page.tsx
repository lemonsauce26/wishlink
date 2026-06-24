import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { AiRecommendClient } from "@/components/wishlist/ai-recommend-client";

export default async function RecommendPage({ params }: { params: { id: string } }) {
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
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center">
          <Link
            href={`/wishlist/${params.id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {wishlist.title}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">✨ AI Gift Ideas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized suggestions based on your wishlist
          </p>
        </div>

        <AiRecommendClient wishlistId={params.id} wishlistTitle={wishlist.title} />
      </main>
    </div>
  );
}
