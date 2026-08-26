"use client";

import { useState } from "react";
import { Play, Loader2, CheckCircle2, XCircle } from "lucide-react";

type CronJob = {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  last_run_at: string | null;
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

export function CronJobCard({ job: initial }: { job: CronJob }) {
  const [job, setJob] = useState(initial);
  const [toggling, setToggling] = useState(false);
  const [running, setRunning] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [modal, setModal] = useState<{ ok: boolean; message: string; detail?: string } | null>(null);

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
    }
  }

  async function handleRunOnce() {
    setRunning(true);
    const res = await fetch(`/api/console/crons/${job.name}/run`, { method: "POST" });
    const data = await res.json();
    setRunning(false);
    if (res.ok) {
      setJob(prev => ({ ...prev, last_run_at: new Date().toISOString() }));
      setModal({ ok: true, message: "Executed successfully." });
    } else {
      setModal({ ok: false, message: "Execution failed.", detail: data.error });
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-background p-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-mono font-semibold text-foreground">{job.name}</p>
            <p className="text-sm text-muted-foreground">{job.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggle}
              disabled={toggling}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                job.enabled
                  ? "bg-emerald-600/10 text-emerald-600 border-emerald-600/20 hover:bg-emerald-600/20"
                  : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${job.enabled ? "bg-emerald-600" : "bg-muted-foreground"}`} />
              {job.enabled ? "Enabled" : "Disabled"}
            </button>
            <button
              onClick={() => setConfirm(true)}
              disabled={running}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run once
            </button>
          </div>
        </div>

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
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirm(false)}
        >
          <div
            className="bg-background rounded-2xl border border-border shadow-xl p-6 w-80 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold">Run once</p>
              <p className="text-sm text-muted-foreground">
                Run <span className="font-mono font-medium text-foreground">{job.name}</span> now?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(false)}
                className="flex-1 text-sm py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setConfirm(false); handleRunOnce(); }}
                className="flex-1 text-sm font-medium py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Run
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-background rounded-2xl border border-border shadow-xl p-6 w-80 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-3 text-center">
              {modal.ok
                ? <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                : <XCircle className="w-10 h-10 text-red-500" />
              }
              <p className="text-sm font-medium">{modal.message}</p>
              {modal.detail && (
                <p className="w-full text-left text-xs font-mono bg-secondary text-red-500 rounded-lg px-3 py-2 break-all">
                  {modal.detail}
                </p>
              )}
            </div>
            <button
              onClick={() => setModal(null)}
              className="w-full text-sm font-medium py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
