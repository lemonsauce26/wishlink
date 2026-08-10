import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function ConsoleDashboardPage() {
  const [
    { count: userCount },
    { count: wishlistCount },
    { count: exploreCount },
    { count: reportCount },
  ] = await Promise.all([
    supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("wishlists").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("wishlists").select("id", { count: "exact", head: true }).not("explore_token", "is", null),
    supabaseAdmin.from("reports").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total Users", value: userCount ?? 0, href: null },
    { label: "Total Wishlists", value: wishlistCount ?? 0, href: null },
    { label: "Explore Public", value: exploreCount ?? 0, href: null },
    { label: "Reports", value: reportCount ?? 0, href: "/console/reports" },
  ];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">WishLink 서비스 현황</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const content = (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
              <p className="text-3xl font-semibold tabular-nums">{s.value.toLocaleString()}</p>
            </>
          );
          return s.href ? (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-xl border border-border px-6 py-5 space-y-1 hover:bg-secondary transition-colors block"
            >
              {content}
            </Link>
          ) : (
            <div key={s.label} className="rounded-xl border border-border px-6 py-5 space-y-1">
              {content}
            </div>
          );
        })}
      </div>
    </main>
  );
}
