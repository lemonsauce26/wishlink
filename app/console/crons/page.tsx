import { supabaseAdmin } from "@/lib/supabase/admin";
import { Timer } from "lucide-react";
import { CronJobCard } from "@/components/console/cron-job-card";

export default async function ConsolecronsPage() {
  const { data: jobs } = await supabaseAdmin
    .from("cron_jobs")
    .select("*")
    .order("created_at", { ascending: true });

  const list = jobs ?? [];

  const logsByJobId: Record<string, {
    id: string;
    cron_job_id: string;
    started_at: string;
    finished_at: string | null;
    status: "running" | "success" | "failed" | "skipped";
    triggered_by: "schedule" | "manual";
    message: string | null;
  }[]> = {};

  if (list.length > 0) {
    const jobIds = list.map((j) => j.id);
    const { data: logs } = await supabaseAdmin
      .from("cron_job_logs")
      .select("*")
      .in("cron_job_id", jobIds)
      .order("started_at", { ascending: false })
      .limit(jobIds.length * 5);

    for (const log of logs ?? []) {
      if (!logsByJobId[log.cron_job_id]) logsByJobId[log.cron_job_id] = [];
      if (logsByJobId[log.cron_job_id].length < 5) {
        logsByJobId[log.cron_job_id].push(log);
      }
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Cron Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Manage scheduled batch jobs. Toggle active status or trigger a one-time test run.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-border p-12 text-center text-muted-foreground space-y-3">
          <Timer className="w-10 h-10 mx-auto opacity-30" />
          <p className="font-medium">No cron jobs registered</p>
          <p className="text-sm">Cron jobs will appear here once added.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((job) => (
            <CronJobCard key={job.id} job={job} logs={logsByJobId[job.id] ?? []} />
          ))}
        </div>
      )}
    </main>
  );
}
