import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";

export default async function ConsoleReportsPage() {
  const { data: reports } = await supabaseAdmin
    .from("reports")
    .select("id, reason, comment, status, created_at, reporter_id, wishlist_id")
    .order("created_at", { ascending: false });

  const items = reports ?? [];

  const [reporterIds, wishlistIds] = [
    [...new Set(items.map((r) => r.reporter_id))],
    [...new Set(items.map((r) => r.wishlist_id))],
  ];

  const [{ data: reporters }, { data: wishlists }] = await Promise.all([
    reporterIds.length > 0
      ? supabaseAdmin.from("users").select("id, nickname, email").in("id", reporterIds)
      : Promise.resolve({ data: [] }),
    wishlistIds.length > 0
      ? supabaseAdmin.from("wishlists").select("id, title, explore_token").in("id", wishlistIds)
      : Promise.resolve({ data: [] }),
  ]);

  const reporterMap = Object.fromEntries((reporters ?? []).map((u) => [u.id, u]));
  const wishlistMap = Object.fromEntries((wishlists ?? []).map((w) => [w.id, w]));

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    reviewed: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    dismissed: "bg-secondary text-muted-foreground",
    actioned: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">신고된 위시리스트 목록</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
          <p className="text-3xl mb-3">🎉</p>
          <p className="font-medium">신고 내역이 없습니다</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">위시리스트</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">신고 사유</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">신고자</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">상태</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">일시</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((report) => {
                const wishlist = wishlistMap[report.wishlist_id];
                const reporter = reporterMap[report.reporter_id];
                return (
                  <tr key={report.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {wishlist?.title ?? report.wishlist_id}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span>{report.reason}</span>
                      {report.comment && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5 max-w-xs truncate" title={report.comment}>
                          {report.comment}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {reporter?.nickname ? `@${reporter.nickname}` : reporter?.email ?? report.reporter_id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[report.status] ?? statusColor.pending}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString("en-CA", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/console/reports/${report.id}`}
                        className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/60 transition-colors whitespace-nowrap"
                      >
                        Process
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
