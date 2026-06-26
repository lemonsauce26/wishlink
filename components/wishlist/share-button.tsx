"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  wishlistId: string;
  shareToken: string;
  visibility: "public" | "private" | "inner_circle";
};

type InviteStatus = "idle" | "loading" | "success" | "duplicate" | "error";

export function ShareButton({ wishlistId, shareToken, visibility }: Props) {
  const [open, setOpen] = useState(false);
  const [privateToast, setPrivateToast] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("idle");

  function openModal() {
    setShareUrl(`${window.location.origin}/share/${shareToken}`);
    setOpen(true);
    setInviteStatus("idle");
    setEmail("");
  }

  function closeModal() {
    setOpen(false);
    setCopied(false);
  }

  function handlePrivateClick() {
    setPrivateToast(true);
    setTimeout(() => setPrivateToast(false), 2500);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || inviteStatus === "loading") return;
    setInviteStatus("loading");
    const res = await fetch("/api/inner-circle/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wishlistId, email: email.trim() }),
    });
    const data = await res.json();
    if (data.success) {
      setInviteStatus("success");
      setEmail("");
      setTimeout(() => setInviteStatus("idle"), 3000);
    } else if (data.error === "already_invited") {
      setInviteStatus("duplicate");
    } else {
      setInviteStatus("error");
    }
  }

  if (visibility === "private") {
    return (
      <div className="relative">
        <button
          onClick={handlePrivateClick}
          title="Private wishlists can't be shared"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium opacity-40 cursor-not-allowed"
        >
          Share
        </button>
        {privateToast && (
          <div className="absolute top-full mt-2 right-0 bg-foreground text-background text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
            🔒 Private wishlists can't be shared
          </div>
        )}
      </div>
    );
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const quickShares = [
    { label: "iMessage", href: `sms:?&body=${encodedUrl}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedUrl}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "Email", href: `mailto:?subject=Check out my wishlist!&body=${encodedUrl}` },
  ];

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
      >
        Share
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative z-10 bg-background rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-5">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-lg leading-none"
            >
              ✕
            </button>

            {visibility === "public" ? (
              <>
                <p className="text-sm text-muted-foreground pr-6">🌐 Anyone with the link can view this</p>

                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-mono truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="rounded-lg bg-foreground text-background px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Share</p>
                  <div className="flex flex-wrap gap-2">
                    {quickShares.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
                      >
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground pr-6">✨ Only people you invite can view this</p>

                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (inviteStatus === "duplicate" || inviteStatus === "error") setInviteStatus("idle");
                    }}
                    placeholder="Email address"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                  <button
                    type="submit"
                    disabled={inviteStatus === "loading"}
                    className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {inviteStatus === "loading" ? "…" : "Invite"}
                  </button>
                </form>

                {inviteStatus === "success" && (
                  <p className="text-sm text-green-600">Invite sent!</p>
                )}
                {inviteStatus === "duplicate" && (
                  <p className="text-sm text-destructive">This email has already been invited</p>
                )}
                {inviteStatus === "error" && (
                  <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
                )}

                <div className="border-t border-border pt-3">
                  <Link
                    href={`/wishlist/${wishlistId}/inner-circle`}
                    onClick={closeModal}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Manage invite list →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
