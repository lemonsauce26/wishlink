import { supabaseAdmin } from "@/lib/supabase/admin";
import { CRON_REGISTRY } from "./registry";

export async function runCron(
  name: string,
  opts?: { force?: boolean; triggeredBy?: "schedule" | "manual" }
) {
  const triggeredBy = opts?.triggeredBy ?? "schedule";
  const handler = CRON_REGISTRY[name];
  if (!handler) throw new Error(`Unknown cron: ${name}`);

  const { data: job } = await supabaseAdmin
    .from("cron_jobs")
    .select("id, enabled")
    .eq("name", name)
    .single();

  if (!job) throw new Error(`Cron not found in DB: ${name}`);

  if (!opts?.force && !job.enabled) {
    await supabaseAdmin.from("cron_job_logs").insert({
      cron_job_id: job.id,
      status: "skipped" as const,
      triggered_by: triggeredBy,
      finished_at: new Date().toISOString(),
    });
    return;
  }

  const { data: log } = await supabaseAdmin
    .from("cron_job_logs")
    .insert({
      cron_job_id: job.id,
      status: "running" as const,
      triggered_by: triggeredBy,
    })
    .select("id")
    .single();

  const logId = log?.id;

  try {
    await handler();

    await Promise.all([
      logId
        ? supabaseAdmin
            .from("cron_job_logs")
            .update({ status: "success", finished_at: new Date().toISOString() })
            .eq("id", logId)
        : Promise.resolve(),
      supabaseAdmin
        .from("cron_jobs")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", job.id),
    ]);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (logId) {
      await supabaseAdmin
        .from("cron_job_logs")
        .update({ status: "failed", message, finished_at: new Date().toISOString() })
        .eq("id", logId);
    }
    throw e;
  }
}
