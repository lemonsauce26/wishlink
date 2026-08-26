import { supabaseAdmin } from "@/lib/supabase/admin";
import { CRON_REGISTRY } from "./registry";

export async function runCron(name: string, opts?: { force?: boolean }) {
  const handler = CRON_REGISTRY[name];
  if (!handler) throw new Error(`Unknown cron: ${name}`);

  if (!opts?.force) {
    const { data: job } = await supabaseAdmin
      .from("cron_jobs")
      .select("enabled")
      .eq("name", name)
      .single();
    if (!job?.enabled) return;
  }

  await handler();

  await supabaseAdmin
    .from("cron_jobs")
    .update({ last_run_at: new Date().toISOString() })
    .eq("name", name);
}
