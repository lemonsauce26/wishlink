import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/layout/app-header";
import { sendReservationCancelledEmail } from "@/lib/email";
import Link from "next/link";

export default async function CancelReservationPage({
  params,
}: {
  params: { cancelToken: string };
}) {
  const { data: reservation } = await supabaseAdmin
    .from("wishitem_reservations")
    .select("id, reserver_email, cancelled_at, wish_item_id")
    .eq("cancel_token", params.cancelToken)
    .single();

  if (!reservation) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="font-medium">Link not found</p>
          <p className="text-sm text-muted-foreground">
            This cancellation link is invalid or has already been used.
          </p>
          <Link href="/" className="text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors">
            Go to WishLink
          </Link>
        </main>
      </div>
    );
  }

  if (reservation.cancelled_at) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
          <p className="text-4xl">✅</p>
          <p className="font-medium">Already cancelled</p>
          <p className="text-sm text-muted-foreground">
            This reservation has already been cancelled.
          </p>
          <Link href="/" className="text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors">
            Go to WishLink
          </Link>
        </main>
      </div>
    );
  }

  const { data: item } = await supabaseAdmin
    .from("wish_items")
    .select("title")
    .eq("id", reservation.wish_item_id)
    .single();

  await supabaseAdmin
    .from("wishitem_reservations")
    .update({ cancelled_at: new Date().toISOString() })
    .eq("id", reservation.id);

  if (reservation.reserver_email) {
    sendReservationCancelledEmail({
      to: reservation.reserver_email,
      itemTitle: item?.title ?? "the item",
    }).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="max-w-md mx-auto px-4 py-24 text-center space-y-3">
        <p className="text-4xl">🙌</p>
        <p className="font-medium">Reservation cancelled</p>
        <p className="text-sm text-muted-foreground">
          Your reservation for <strong>&ldquo;{item?.title}&rdquo;</strong> has been cancelled.
          The slot is now available again.
        </p>
        <Link href="/" className="text-sm underline underline-offset-2 text-muted-foreground hover:text-foreground transition-colors">
          Go to WishLink
        </Link>
      </main>
    </div>
  );
}
