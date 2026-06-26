"use client";

import { useState } from "react";

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

type InviteFormStatus = "idle" | "loading" | "duplicate" | "error";

export function InnerCircleClient({ wishlistId, initialPending, initialAccepted, initialCancelled }: Props) {
  const [pending, setPending] = useState(initialPending);
  const [accepted, setAccepted] = useState(initialAccepted);
  const [cancelled, setCancelled] = useState(initialCancelled);
  const [email, setEmail] = useState("");
  const [formStatus, setFormStatus] = useState<InviteFormStatus>("idle");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmRevokeTarget, setConfirmRevokeTarget] = useState<Invite | null>(null);
  const [confirmReinviteTarget, setConfirmReinviteTarget] = useState<{ id: string; email: string } | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || formStatus === "loading") return;
    setFormStatus("loading");

    const res = await fetch("/api/inner-circle/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlistId, email: email.trim() }),
    });
    const data = await res.json();

    if (data.success) {
      setPending((prev) => [
        ...prev,
        {
          id: data.id,
          invitee_email: email.trim().toLowerCase(),
          status: "pending",
          invited_at: new Date().toISOString(),
        },
      ]);
      setEmail("");
      setFormStatus("idle");
    } else if (data.error === "previously_cancelled") {
      setFormStatus("idle");
      setConfirmReinviteTarget({ id: data.id, email: email.trim().toLowerCase() });
    } else if (data.error === "already_invited") {
      setFormStatus("duplicate");
    } else {
      setFormStatus("error");
    }
  }

  async function executeReinvite() {
    if (!confirmReinviteTarget) return;
    const { id, email: reinviteEmail } = confirmReinviteTarget;
    setConfirmReinviteTarget(null);

    const res = await fetch(`/api/inner-circle/invite/${id}/reinvite`, {
      method: "PATCH",
    });
    const data = await res.json();

    if (data.success) {
      setCancelled((prev) => prev.filter((i) => i.id !== id));
      setPending((prev) => [
        { id, invitee_email: reinviteEmail, status: "pending", invited_at: new Date().toISOString() },
        ...prev,
      ]);
      setEmail("");
    }
  }

  async function executeRevoke(invite: Invite) {
    setConfirmRevokeTarget(null);
    setCancellingId(invite.id);

    const res = await fetch(`/api/inner-circle/invite/${invite.id}`, {
      method: "PATCH",
    });
    const data = await res.json();

    if (data.success) {
      const revokedInvite = { ...invite, status: "cancelled" as const };
      if (invite.status === "accepted") {
        setAccepted((prev) => prev.filter((i) => i.id !== invite.id));
      } else {
        setPending((prev) => prev.filter((i) => i.id !== invite.id));
      }
      setCancelled((prev) => [revokedInvite, ...prev]);
    }
    setCancellingId(null);
  }

  function handleRevokeClick(invite: Invite) {
    if (invite.status === "accepted") {
      setConfirmRevokeTarget(invite);
    } else {
      executeRevoke(invite);
    }
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
              onChange={(e) => {
                setEmail(e.target.value);
                if (formStatus === "duplicate" || formStatus === "error") setFormStatus("idle");
              }}
              placeholder="Email address"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <button
              type="submit"
              disabled={formStatus === "loading"}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {formStatus === "loading" ? "…" : "Send Invite"}
            </button>
          </form>
          {formStatus === "duplicate" && (
            <p className="text-sm text-destructive">This email has already been invited</p>
          )}
          {formStatus === "error" && (
            <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
          )}
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
                    disabled={cancellingId === invite.id}
                    className="text-sm text-destructive hover:opacity-70 transition-opacity disabled:opacity-40"
                  >
                    {cancellingId === invite.id ? "…" : "Revoke"}
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
                      disabled
                      className="text-sm text-muted-foreground opacity-40 cursor-not-allowed"
                      title="Email sending coming soon"
                    >
                      Resend
                    </button>
                    <button
                      onClick={() => handleRevokeClick(invite)}
                      disabled={cancellingId === invite.id}
                      className="text-sm text-destructive hover:opacity-70 transition-opacity disabled:opacity-40"
                    >
                      {cancellingId === invite.id ? "…" : "Cancel"}
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

      {/* Confirm revoke modal */}
      {confirmRevokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmRevokeTarget(null)} />
          <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-semibold">Revoke access?</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{confirmRevokeTarget.invitee_email}</span> will no longer be able to view this wishlist.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmRevokeTarget(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeRevoke(confirmRevokeTarget)}
                className="rounded-lg bg-destructive text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm re-invite modal */}
      {confirmReinviteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Re-invite
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
