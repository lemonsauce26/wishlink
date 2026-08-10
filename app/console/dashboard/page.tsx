import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function ConsoleDashboardPage() {
  const [
    { count: userCount },
    { count: wishlistCount },
    { count: exploreCount },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("wishlists").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("wishlists").select("id", { count: "exact", head: true }).not("explore_token", "is", null),
  ]);

  const stats = [
    { label: "Total Users", value: userCount ?? 0 },
    { label: "Total Wishlists", value: wishlistCount ?? 0 },
    { label: "Explore Public", value: exploreCount ?? 0 },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>
    </main>
  );
}
