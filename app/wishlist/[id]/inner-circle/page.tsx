import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InnerCircleClient } from "./inner-circle-client";

export default async function InnerCirclePage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/login?next=/wishlist/${params.id}/inner-circle`);

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, title, user_id")
    .eq("id", params.id)
    .single();

  if (!wishlist || wishlist.user_id !== user.id) redirect("/dashboard");

  const { data: invites } = await supabase
    .from("wishlist_invites")
    .select("id, invitee_email, status, invited_at")
    .eq("wishlist_id", params.id)
    .order("invited_at", { ascending: false });

  const allInvites = invites ?? [];
  const pending = allInvites.filter((i) => i.status === "pending");
  const accepted = allInvites.filter((i) => i.status === "accepted");
  const cancelled = allInvites.filter((i) => i.status === "cancelled");

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

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-2">
        <h1 className="text-2xl font-bold">✨ Inner Circle</h1>
        <p className="text-sm text-muted-foreground pb-4">
          Only people you invite can view this wishlist.
        </p>

        <InnerCircleClient
          wishlistId={params.id}
          initialPending={pending}
          initialAccepted={accepted}
          initialCancelled={cancelled}
        />
      </main>
    </div>
  );
}
