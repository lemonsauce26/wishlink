import { supabaseAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ReportAdminActions } from "@/components/console/report-admin-actions";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: report } = await supabaseAdmin
    .from("reports")
    .select("id, reason, comment, status, created_at, wishlist_id, reporter_id")
    .eq("id", id)
    .single();

  if (!report) notFound();

  const [{ data: wishlist }, { data: reporter }] = await Promise.all([
    supabaseAdmin
      .from("wishlists")
      .select("id, title, event_type, explore_token, created_at, updated_at, user_id")
      .eq("id", report.wishlist_id)
      .single(),
    supabaseAdmin
      .from("users")
      .select("id, nickname, email")
      .eq("id", report.reporter_id)
      .single(),
  ]);

  const [{ data: owner }, { data: adminHistory }] = await Promise.all([
    wishlist
      ? supabaseAdmin.from("users").select("id, nickname, email").eq("id", wishlist.user_id).single()
      : Promise.resolve({ data: null }),
    supabaseAdmin
      .from("admin_report")
      .select("id, comment, status, created_at, admin_id")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true }),
  ]);

  const adminIds = [...new Set((adminHistory ?? []).map((h) => h.admin_id))];
  const { data: admins } = adminIds.length > 0
    ? await supabaseAdmin.from("users").select("id, display_name, nickname, email").in("id", adminIds)
    : { data: [] };

  const adminMap = Object.fromEntries((admins ?? []).map((a) => [a.id, a]));

  const history = (adminHistory ?? []).map((h) => ({
    ...h,
    adminDisplayName: adminMap[h.admin_id]?.display_name ?? adminMap[h.admin_id]?.nickname ?? "admin",
    adminEmail: adminMap[h.admin_id]?.email ?? null,
  }));

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    processing: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/console/reports"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Reports
        </Link>
        <span
          className={`ml-auto inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[report.status] ?? statusColor.pending}`}
        >
          {report.status}
        </span>
      </div>

      {/* 위시리스트 정보 */}
      <section className="rounded-xl border border-border divide-y divide-border">
        <div className="px-5 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Wishlist</p>
          <p className="font-semibold text-lg">
            {wishlist?.title ?? report.wishlist_id}
          </p>
          {wishlist?.explore_token && (
            <a
              href={`/explore/${wishlist.explore_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:underline mt-0.5 inline-block"
            >
              View in Explore →
            </a>
          )}
        </div>
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">Owner</p>
            <p className="text-sm font-medium">
              {owner?.nickname ? `@${owner.nickname}` : owner?.email ?? "—"}
            </p>
            {owner?.nickname && (
              <p className="text-xs text-muted-foreground mt-0.5">{owner.email}</p>
            )}
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">Created</p>
            <p className="text-sm font-medium tabular-nums">
              {wishlist ? fmt(wishlist.created_at) : "—"}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">Last updated</p>
            <p className="text-sm font-medium tabular-nums">
              {wishlist ? fmt(wishlist.updated_at) : "—"}
            </p>
          </div>
        </div>
      </section>

      {/* 신고 정보 */}
      <section className="rounded-xl border border-border divide-y divide-border">
        <div className="px-5 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Report</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">Reporter</p>
            <p className="text-sm font-medium">
              {reporter?.nickname ? `@${reporter.nickname}` : reporter?.email ?? "—"}
            </p>
            {reporter?.nickname && (
              <p className="text-xs text-muted-foreground mt-0.5">{reporter.email}</p>
            )}
          </div>
          <div className="px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">Submitted</p>
            <p className="text-sm font-medium tabular-nums">
              {new Date(report.created_at).toLocaleString("en-CA", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-xs text-muted-foreground mb-1">Reason</p>
          <p className="text-sm font-medium">{report.reason}</p>
          {report.reason.toLowerCase() === "other" && report.comment && (
            <p className="text-sm text-muted-foreground mt-1">{report.comment}</p>
          )}
        </div>
      </section>

      <ReportAdminActions
        reportId={report.id}
        initialStatus={report.status}
        history={history}
      />
    </main>
  );
}
