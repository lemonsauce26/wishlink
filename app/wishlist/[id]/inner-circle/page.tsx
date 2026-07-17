import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InnerCircleClient } from "./inner-circle-client";
import { AppHeader } from "@/components/layout/app-header";

export default async function InnerCirclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/auth/login?next=/wishlist/${id}/inner-circle`);

  const { data: wishlist } = await supabase
    .from("wishlists")
    .select("id, title, user_id")
    .eq("id", id)
    .single();

  if (!wishlist || wishlist.user_id !== user.id) redirect("/dashboard");

  const { data: invites } = await supabase
    .from("wishlist_invites")
    .select("id, invitee_email, status, invited_at")
    .eq("wishlist_id", id)
    .order("invited_at", { ascending: false });

  const allInvites = invites ?? [];
  const pending = allInvites.filter((i) => i.status === "pending");
  const accepted = allInvites.filter((i) => i.status === "accepted");
  const cancelled = allInvites.filter((i) => i.status === "cancelled");

  return (
    <div className="min-h-dvh bg-background">
      <AppHeader />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-2">
        <h1 className="text-2xl font-bold">✨ Inner Circle</h1>
        <p className="text-sm text-muted-foreground pb-4">
          Only people you invite can view this wishlist.
        </p>

        <InnerCircleClient
          wishlistId={id}
          initialPending={pending}
          initialAccepted={accepted}
          initialCancelled={cancelled}
        />
      </main>
    </div>
  );
}
