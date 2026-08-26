import { supabaseAdmin } from "@/lib/supabase/admin";
import { Timer } from "lucide-react";
import { CronJobCard } from "@/components/console/cron-job-card";

export default async function ConsolecronsPage() {
  const { data: jobs } = await supabaseAdmin
    .from("cron_jobs")
    .select("*")
    .order("created_at", { ascending: true });

  const list = jobs ?? [];

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
            <CronJobCard key={job.name} job={job} />
          ))}
        </div>
      )}
    </main>
  );
}
