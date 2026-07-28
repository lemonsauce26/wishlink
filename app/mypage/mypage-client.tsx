"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User, X, Camera } from "lucide-react";

const NICKNAME_REGEX = /^[a-zA-Z0-9_]{2,20}$/;

type Props = {
  userId: string;
  displayName: string;
  initialNickname: string;
  email: string;
  avatarUrl: string | null;
  joinedAt: string | null;
};

type ResultModal = { success: boolean; message: string };

export function MyPageClient({
  userId,
  displayName,
  initialNickname,
  email,
  avatarUrl: initialAvatarUrl,
  joinedAt,
}: Props) {
  const [nickname, setNickname] = useState(initialNickname);
  const [checked, setChecked] = useState<"available" | "taken" | null>(null);
  const [checking, setChecking] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [showPreview, setShowPreview] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resultModal, setResultModal] = useState<ResultModal | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => { setMounted(true); }, []);

  const isValidFormat = NICKNAME_REGEX.test(nickname.trim());
  const nicknameChanged = nickname.trim() !== initialNickname;
  const canSave = nicknameChanged && checked === "available";

  function handleNicknameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNickname(e.target.value);
    setChecked(null);
  }

  async function handleCheck() {
    if (!isValidFormat) return;
    setChecking(true);

    const res = await fetch("/api/users/nickname-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });
    const data = await res.json();
    setChecked(data.available ? "available" : "taken");
    setChecking(false);
  }

  async function handleSaveNickname() {
    if (!canSave || saving) return;
    setSaving(true);

    const res = await fetch("/api/users/nickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nickname.trim() }),
    });

    setSaving(false);
    if (res.status === 409) {
      setChecked("taken");
      setResultModal({ success: false, message: "This nickname is already taken." });
    } else if (!res.ok) {
      setResultModal({ success: false, message: "Failed to update nickname. Please try again." });
    } else {
      setResultModal({ success: true, message: "Your nickname has been updated." });
      router.refresh();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploadError("Failed to upload image. Please try again.");
      setUploading(false);
      e.target.value = "";
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: urlData.publicUrl }),
    });

    setAvatarUrl(newUrl);
    setUploading(false);
    setShowPreview(false);
    e.target.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Profile picture */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setShowPreview(true)}
          className="w-20 h-20 rounded-full bg-secondary border border-border overflow-hidden flex items-center justify-center focus:outline-none hover:opacity-80 transition-opacity"
          aria-label="View profile picture"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-muted-foreground" />
          )}
        </button>
        {joinedAt && (
          <p className="text-xs text-muted-foreground">Joined {joinedAt}</p>
        )}
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {/* Name - read only */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Name</label>
          <div className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5 text-sm text-muted-foreground">
            {displayName || "—"}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Shown to wishlist owners when you reserve a gift — except in Surprise Me mode.
          </p>
        </div>

        {/* Nickname - editable */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Nickname</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={handleNicknameChange}
              maxLength={20}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleCheck}
              disabled={!isValidFormat || !nicknameChanged || checking}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {checking ? "Checking…" : "Check"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            2–20 characters. Letters, numbers, and underscores only.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This is how you appear on your shared wishlists.
          </p>
          {checked === "available" && (
            <p className="text-xs text-emerald-600 font-medium">✓ Available</p>
          )}
          {checked === "taken" && (
            <p className="text-xs text-destructive font-medium">✗ Already taken</p>
          )}
        </div>

        {/* Login Email - read only */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Login Email</label>
          <div className="flex items-center gap-2 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-sm text-muted-foreground">{email}</span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSaveNickname}
        disabled={!canSave || saving}
        className="w-full rounded-lg bg-emerald-600 text-white py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save"}
      </button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Save result modal */}
      {mounted && resultModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-6">
          <div className="bg-background rounded-2xl p-6 w-full max-w-xs shadow-xl space-y-4">
            <p className="text-2xl">{resultModal.success ? "✅" : "⚠️"}</p>
            <p className="font-semibold">{resultModal.success ? "Updated" : "Update Failed"}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{resultModal.message}</p>
            <button
              onClick={() => setResultModal(null)}
              className="w-full rounded-xl bg-emerald-600 text-white text-sm font-medium py-2.5 hover:bg-emerald-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Avatar preview modal */}
      {mounted && showPreview && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-6"
          onClick={() => !uploading && setShowPreview(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <div className="w-72 h-72 rounded-2xl overflow-hidden bg-secondary border border-border/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-24 h-24 text-muted-foreground" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                  <p className="text-white text-sm font-medium">Uploading...</p>
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -top-3 -right-3 flex items-center gap-1 bg-emerald-600 text-white rounded-full px-3 py-1.5 text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <Camera className="w-3 h-3" />
              Change
            </button>

            <button
              onClick={() => !uploading && setShowPreview(false)}
              disabled={uploading}
              className="absolute -top-3 -left-3 bg-background border border-border rounded-full p-1.5 hover:bg-secondary transition-colors disabled:opacity-50 shadow-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {uploadError && (
              <p className="absolute -bottom-8 left-0 right-0 text-center text-xs text-red-400">
                {uploadError}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
