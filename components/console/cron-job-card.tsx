"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle, Clock, SkipForward } from "lucide-react";

type CronJob = {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  last_run_at: string | null;
};

type CronJobLog = {
  id: string;
  cron_job_id: string;
  started_at: string;
  finished_at: string | null;
  status: "running" | "success" | "failed" | "skipped";
  triggered_by: "schedule" | "manual";
  message: string | null;
};

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(started: string, finished: string | null): string {
  if (!finished) return "—";
  const ms = new Date(finished).getTime() - new Date(started).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

const STATUS_CONFIG = {
  success: { icon: CheckCircle2, color: "text-emerald-600" },
  failed: { icon: XCircle, color: "text-red-500" },
  running: { icon: Clock, color: "text-yellow-500" },
  skipped: { icon: SkipForward, color: "text-muted-foreground" },
} as const;

export function CronJobCard({ job: initial, logs: initialLogs }: { job: CronJob; logs: CronJobLog[] }) {
  const [job, setJob] = useState(initial);
  const [logs, setLogs] = useState(initialLogs);
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  function showToast(text: string, ok: boolean) {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleToggle() {
    setToggling(true);
    const next = !job.enabled;
    const res = await fetch(`/api/console/crons/${job.name}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    setToggling(false);
    if (res.ok) {
      setJob(prev => ({ ...prev, enabled: next }));
    } else {
      showToast("Failed to update", false);
    }
  }

  async function handleRunOnce() {
    setRunning(true);
    const res = await fetch(`/api/console/crons/${job.name}/run`, { method: "POST" });
    const data = await res.json();
    const now = new Date().toISOString();
    setRunning(false);
    if (res.ok) {
      setJob(prev => ({ ...prev, last_run_at: now }));
      const newLog: CronJobLog = {
        id: crypto.randomUUID(),
        cron_job_id: job.id,
        started_at: now,
        finished_at: now,
        status: "success",
        triggered_by: "manual",
        message: null,
      };
      setLogs(prev => [newLog, ...prev].slice(0, 5));
      showToast("Executed successfully", true);
    } else {
      const newLog: CronJobLog = {
        id: crypto.randomUUID(),
        cron_job_id: job.id,
        started_at: now,
        finished_at: now,
        status: "failed",
        triggered_by: "manual",
        message: data.error ?? null,
      };
      setLogs(prev => [newLog, ...prev].slice(0, 5));
      showToast(data.error ?? "Execution failed", false);
    }
  }

  return (
    <div className="relative rounded-xl border border-border bg-background overflow-hidden">
      {/* 카드 본문 */}
      <div className="p-5 space-y-3">
        {/* 토스트 */}
        {toast && (
          <div
            className={`absolute top-3 right-3 text-xs px-3 py-1.5 rounded-lg font-medium z-10 ${
              toast.ok
                ? "bg-emerald-600/10 text-emerald-600 border border-emerald-600/20"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-mono font-semibold text-foreground">{job.name}</p>
            <p className="text-sm text-muted-foreground">{job.description}</p>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              job.enabled
                ? "bg-emerald-600/10 text-emerald-600 border-emerald-600/20 hover:bg-emerald-600/20"
                : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${job.enabled ? "bg-emerald-600" : "bg-muted-foreground"}`} />
            {job.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>

        {/* 메타 정보 */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="text-foreground/60 font-medium">Schedule</span>{" "}
            <span className="font-mono">{job.schedule}</span>
            <span className="ml-2 text-muted-foreground/60">(daily at 09:00 KST)</span>
          </p>
          <p>
            <span className="text-foreground/60 font-medium">Last run</span>{" "}
            {formatDateTime(job.last_run_at)}
          </p>
        </div>

        {/* 액션 */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleRunOnce}
            disabled={running}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run once
          </button>
        </div>
      </div>

      {/* 로그 테이블 */}
      {logs.length > 0 && (
        <div className="border-t border-border">
          <div className="px-5 py-2 bg-secondary/30">
            <p className="text-xs font-medium text-muted-foreground">Recent runs</p>
          </div>
          <div className="divide-y divide-border">
            {logs.map((log) => {
              const { icon: Icon, color } = STATUS_CONFIG[log.status];
              return (
                <div key={log.id} className="flex items-center gap-3 px-5 py-2.5 text-xs">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                  <span className="text-muted-foreground font-mono w-36 shrink-0">
                    {formatDateTime(log.started_at)}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                    log.triggered_by === "manual"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {log.triggered_by}
                  </span>
                  <span className="text-muted-foreground shrink-0 w-10">
                    {formatDuration(log.started_at, log.finished_at)}
                  </span>
                  {log.message && (
                    <span className="text-red-500 truncate">{log.message}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
