"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{2,20}$/;

export function NicknameSetupClient() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [checked, setChecked] = useState<"available" | "taken" | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidFormat = NICKNAME_REGEX.test(nickname.trim());

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNickname(e.target.value);
    setChecked(null);
    setError(null);
  }

  async function handleCheck() {
    if (!isValidFormat) return;
    setChecking(true);
    setError(null);

    const res = await fetch("/api/users/nickname-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });
    const data = await res.json();
    setChecked(data.available ? "available" : "taken");
    setChecking(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checked !== "available" || saving) return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/users/nickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });

    if (res.status === 409) {
      setChecked("taken");
      setSaving(false);
      return;
    }
    if (!res.ok) {
      setError("Failed to save nickname. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nickname</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={handleChange}
            placeholder="e.g. john_doe"
            maxLength={20}
            autoFocus
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!isValidFormat || checking}
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {checking ? "Checking…" : "Check"}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          2–20 characters. Letters, numbers, and underscores only.
        </p>

        {checked === "available" && (
          <p className="text-xs text-emerald-600 font-medium">✓ Available</p>
        )}
        {checked === "taken" && (
          <p className="text-xs text-destructive font-medium">✗ Already taken</p>
        )}
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={checked !== "available" || saving}
        className="w-full rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
