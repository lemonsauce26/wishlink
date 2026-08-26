"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";

type CronJob = {
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  last_run_at: string | null;
};

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function CronJobCard({ job: initial }: { job: CronJob }) {
  const [job, setJob] = useState(initial);
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
    setRunning(false);
    if (res.ok) {
      setJob(prev => ({ ...prev, last_run_at: new Date().toISOString() }));
      showToast("Executed successfully", true);
    } else {
      showToast(data.error ?? "Execution failed", false);
    }
  }

  return (
    <div className="relative rounded-xl border border-border bg-background p-5 space-y-3">
      {/* 토스트 */}
      {toast && (
        <div
          className={`absolute top-3 right-3 text-xs px-3 py-1.5 rounded-lg font-medium ${
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
          <span
            className={`w-1.5 h-1.5 rounded-full ${job.enabled ? "bg-emerald-600" : "bg-muted-foreground"}`}
          />
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
          {running ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Run once
        </button>
      </div>
    </div>
  );
}
