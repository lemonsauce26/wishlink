"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  { value: "birthday", label: "🎂 Birthday" },
  { value: "mothers_day", label: "🌸 Mother's Day" },
  { value: "fathers_day", label: "👨 Father's Day" },
  { value: "valentines", label: "💝 Valentine's Day" },
  { value: "christmas", label: "🎄 Christmas" },
  { value: "hanukkah", label: "🕎 Hanukkah" },
  { value: "engagement", label: "💍 Engagement" },
  { value: "bridal_shower", label: "👰 Bridal Shower" },
  { value: "wedding", label: "🥂 Wedding" },
  { value: "anniversary", label: "🎊 Anniversary" },
  { value: "baby_shower", label: "👶 Baby Shower" },
  { value: "graduation", label: "🎓 Graduation" },
  { value: "new_job", label: "💼 New Job" },
  { value: "retirement", label: "🌅 Retirement" },
  { value: "housewarming", label: "🏠 Housewarming" },
  { value: "just_because", label: "🎉 Just Because" },
] as const;

const VISIBILITY_OPTIONS = [
  { value: "public", label: "🌐 Public", description: "Anyone with the link can view" },
  { value: "inner_circle", label: "✨ Inner Circle", description: "Only people you invite" },
  { value: "private", label: "🔒 Private", description: "Only you can see this" },
] as const;

const RESERVATION_OPTIONS = [
  {
    value: "surprise",
    label: "Surprise Me!",
    description: "I don't need to know who's getting what — I love the excitement of being surprised!",
  },
  {
    value: "show",
    label: "Show Me Who Cares",
    description: "I'd love to know who's putting in the thought — their kindness means everything to me!",
  },
  {
    value: "verified",
    label: "Verified Only",
    description: "Only logged-in members can claim items — I want to know exactly who's giving.",
  },
] as const;

type FormValues = {
  title: string;
  event_type: string;
  event_date: string;
  visibility: "public" | "private" | "inner_circle";
  reservation_visibility: "surprise" | "show" | "verified";
};

type Props = {
  mode: "create" | "edit";
  wishlistId?: string;
  defaultValues?: Partial<FormValues>;
};

export function WishlistForm({ mode, wishlistId, defaultValues }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [values, setValues] = useState<FormValues>({
    title: defaultValues?.title ?? "",
    event_type: defaultValues?.event_type ?? "birthday",
    event_date: defaultValues?.event_date ?? "",
    visibility: defaultValues?.visibility ?? "public",
    reservation_visibility: defaultValues?.reservation_visibility ?? "surprise",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;
    setLoading(true);
    setError(null);

    const payload = {
      title: values.title.trim(),
      event_type: values.event_type,
      event_date: values.event_date || null,
      visibility: values.visibility,
      reservation_visibility: values.reservation_visibility,
    };

    if (mode === "create") {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data, error: err } = await supabase
        .from("wishlists")
        .insert({ ...payload, user_id: user.id })
        .select("id")
        .single();

      if (err) { setError(err.message); setLoading(false); return; }
      router.push(`/wishlist/${data.id}`);
    } else {
      const { error: err } = await supabase
        .from("wishlists")
        .update(payload)
        .eq("id", wishlistId!);

      if (err) { setError(err.message); setLoading(false); return; }
      router.push("/dashboard");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title *</label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. My Birthday Wishlist"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      {/* Event type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Occasion</label>
        <select
          value={values.event_type}
          onChange={(e) => set("event_type", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Event date */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Event Date <span className="text-muted-foreground font-normal">(optional)</span></label>
        <input
          type="date"
          value={values.event_date}
          onChange={(e) => set("event_date", e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Visibility */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Who can see this?</label>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                values.visibility === opt.value
                  ? "border-foreground bg-secondary"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={values.visibility === opt.value}
                onChange={() => set("visibility", opt.value)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Reservation visibility */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Reservation visibility</label>
        <div className="space-y-2">
          {RESERVATION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                values.reservation_visibility === opt.value
                  ? "border-foreground bg-secondary"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <input
                type="radio"
                name="reservation_visibility"
                value={opt.value}
                checked={values.reservation_visibility === opt.value}
                onChange={() => set("reservation_visibility", opt.value)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !values.title.trim()}
          className="flex-1 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Saving…" : mode === "create" ? "Create Wishlist" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
