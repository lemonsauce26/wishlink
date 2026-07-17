"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

type Invite = {
  id: string;
  invitee_email: string;
  status: "pending" | "accepted" | "cancelled";
  invited_at: string;
};

type Props = {
  wishlistId: string;
  initialPending: Invite[];
  initialAccepted: Invite[];
  initialCancelled: Invite[];
};

type InviteFormStatus = "idle" | "loading";

type EmailActionState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "result"; success: boolean; message: string };

function emailErrorMessage(code: number | null, context: string): string {
  const prefix = code ? `[${code}] ` : "";
  return `${prefix}${context}`;
}

export function InnerCircleClient({ wishlistId, initialPending, initialAccepted, initialCancelled }: Props) {
  const [pending, setPending] = useState(initialPending);
  const [accepted, setAccepted] = useState(initialAccepted);
  const [cancelled, setCancelled] = useState(initialCancelled);
  const [email, setEmail] = useState("");
  const [formStatus, setFormStatus] = useState<InviteFormStatus>("idle");
  const [confirmRevokeTarget, setConfirmRevokeTarget] = useState<Invite | null>(null);
  const [confirmReinviteTarget, setConfirmReinviteTarget] = useState<{ id: string; email: string } | null>(null);
  const [emailAction, setEmailAction] = useState<EmailActionState>({ phase: "idle" });

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || formStatus === "loading") return;
    setFormStatus("loading");
    setEmailAction({ phase: "loading" });

    try {
      const res = await fetch("/api/inner-circle/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wishlistId, email: email.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        const sentEmail = email.trim().toLowerCase();
        setPending((prev) => [
          ...prev,
          { id: data.id, invitee_email: sentEmail, status: "pending", invited_at: new Date().toISOString() },
        ]);
        setEmail("");
        setFormStatus("idle");
        setEmailAction({ phase: "result", success: true, message: `Invite sent to ${sentEmail}! 🎉` });
      } else if (data.error === "previously_cancelled") {
        setEmailAction({ phase: "idle" });
        setFormStatus("idle");
        setConfirmReinviteTarget({ id: data.id, email: email.trim().toLowerCase() });
      } else if (data.error === "already_invited") {
        setFormStatus("idle");
        setEmailAction({ phase: "result", success: false, message: "Looks like they've already been invited!" });
      } else if (data.error === "email_failed") {
        setFormStatus("idle");
        setEmailAction({ phase: "result", success: false, message: emailErrorMessage(data.code, "Oops! Couldn't send the invite. Please try again!") });
      } else {
        setFormStatus("idle");
        setEmailAction({ phase: "result", success: false, message: "Oops! Something went wrong. Please try again!" });
      }
    } catch {
      setFormStatus("idle");
      setEmailAction({ phase: "result", success: false, message: "Oops! Something went wrong. Please try again!" });
    }
  }

  async function executeReinvite() {
    if (!confirmReinviteTarget) return;
    const { id, email: reinviteEmail } = confirmReinviteTarget;
    setConfirmReinviteTarget(null);
    setEmailAction({ phase: "loading" });

    try {
      const res = await fetch(`/api/inner-circle/invite/${id}/reinvite`, { method: "PATCH" });
      const data = await res.json();

      if (data.success) {
        setCancelled((prev) => prev.filter((i) => i.id !== id));
        setPending((prev) => [
          { id, invitee_email: reinviteEmail, status: "pending", invited_at: new Date().toISOString() },
          ...prev,
        ]);
        setEmail("");
        setEmailAction({ phase: "result", success: true, message: `Invite sent to ${reinviteEmail} again! 🎉` });
      } else if (data.error === "email_failed") {
        setEmailAction({ phase: "result", success: false, message: emailErrorMessage(data.code, "Oops! Couldn't send the invite. Please try again!") });
      } else {
        setEmailAction({ phase: "result", success: false, message: "Oops! Something went wrong. Please try again!" });
      }
    } catch {
      setEmailAction({ phase: "result", success: false, message: "Oops! Something went wrong. Please try again!" });
    }
  }

  async function handleResend(invite: Invite) {
    setEmailAction({ phase: "loading" });

    try {
      const res = await fetch(`/api/inner-circle/invite/${invite.id}/resend`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setEmailAction({ phase: "result", success: true, message: `Invite resent to ${invite.invitee_email}! 🎉` });
      } else if (data.error === "email_failed") {
        setEmailAction({ phase: "result", success: false, message: emailErrorMessage(data.code, "Oops! Couldn't resend the invite. Please try again!") });
      } else {
        setEmailAction({ phase: "result", success: false, message: "Oops! Something went wrong. Please try again!" });
      }
    } catch {
      setEmailAction({ phase: "result", success: false, message: "Oops! Something went wrong. Please try again!" });
    }
  }

  async function executeRevoke(invite: Invite) {
    setConfirmRevokeTarget(null);
    setEmailAction({ phase: "loading" });

    const res = await fetch(`/api/inner-circle/invite/${invite.id}`, { method: "PATCH" });
    const data = await res.json();

    if (data.success) {
      const revokedInvite = { ...invite, status: "cancelled" as const };
      if (invite.status === "accepted") {
        setAccepted((prev) => prev.filter((i) => i.id !== invite.id));
      } else {
        setPending((prev) => prev.filter((i) => i.id !== invite.id));
      }
      setCancelled((prev) => [revokedInvite, ...prev]);
      const successMsg = invite.status === "accepted"
        ? `${invite.invitee_email}'s access has been revoked.`
        : `Invite to ${invite.invitee_email} has been cancelled.`;
      setEmailAction({ phase: "result", success: true, message: successMsg });
    } else {
      const failMsg = invite.status === "accepted"
        ? "Oops! Couldn't revoke access. Please try again!"
        : "Oops! Couldn't cancel the invite. Please try again!";
      setEmailAction({ phase: "result", success: false, message: failMsg });
    }
  }

  function handleRevokeClick(invite: Invite) {
    setConfirmRevokeTarget(invite);
  }

  return (
    <>
      <div className="space-y-8">
        {/* Invite form */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">📧 Invite</h2>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <button
              type="submit"
              disabled={formStatus === "loading"}
              className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Send Invite
            </button>
          </form>
        </section>

        {/* Accepted */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            ✅ Accepted ({accepted.length})
          </h2>
          {accepted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one has accepted yet</p>
          ) : (
            <ul className="space-y-2">
              {accepted.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <span className="text-sm">{invite.invitee_email}</span>
                  <button
                    onClick={() => handleRevokeClick(invite)}
                    className="text-sm text-destructive hover:opacity-70 transition-opacity"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Pending */}
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            ⏳ Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending invites</p>
          ) : (
            <ul className="space-y-2">
              {pending.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <span className="text-sm">{invite.invitee_email}</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleResend(invite)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Resend
                    </button>
                    <button
                      onClick={() => handleRevokeClick(invite)}
                      className="text-sm text-destructive hover:opacity-70 transition-opacity"
                    >
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Revoked */}
        {cancelled.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              🚫 Revoked ({cancelled.length})
            </h2>
            <ul className="space-y-2">
              {cancelled.map((invite) => (
                <li key={invite.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 opacity-50">
                  <span className="text-sm line-through">{invite.invitee_email}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {emailAction.phase === "loading" && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>,
        document.body
      )}

      {emailAction.phase === "result" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <p className="text-2xl">{emailAction.success ? "✅" : "❌"}</p>
            <p className="font-semibold">{emailAction.success ? "All done!" : "Uh-oh!"}</p>
            <p className="text-sm text-muted-foreground">{emailAction.message}</p>
            <button
              onClick={() => setEmailAction({ phase: "idle" })}
              className="w-full rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>,
        document.body
      )}

      {confirmRevokeTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmRevokeTarget(null)} />
          <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-semibold">
              {confirmRevokeTarget.status === "pending" ? "Cancel this invitation?" : "Revoke access?"}
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{confirmRevokeTarget.invitee_email}</span>
              {confirmRevokeTarget.status === "pending"
                ? " will no longer receive the invitation."
                : " will no longer be able to view this wishlist."}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmRevokeTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => executeRevoke(confirmRevokeTarget)}
                className="rounded-lg bg-destructive text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                {confirmRevokeTarget.status === "pending" ? "Cancel Invitation" : "Revoke"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {confirmReinviteTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmReinviteTarget(null)} />
          <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-semibold">Re-invite this person?</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{confirmReinviteTarget.email}</span> was previously revoked. Would you like to invite them again?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmReinviteTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeReinvite}
                className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                Re-invite
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
