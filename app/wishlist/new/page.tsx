import { WishlistForm } from "@/components/wishlist/wishlist-form";

export default function NewWishlistPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">New Wishlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add items after creating your list.
          </p>
        </div>
        <WishlistForm mode="create" />
      </div>
    </div>
  );
}
