"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PRIORITY_OPTIONS = [
  { value: "high" as const, label: "⭐ High" },
  { value: "medium" as const, label: "🔵 Medium" },
  { value: "low" as const, label: "⚪ Low" },
];

const RECEIVING_OPTIONS = [
  { value: "either" as const, label: "Either is fine", description: "Pickup or shipping works" },
  { value: "shipping" as const, label: "Ship it to me", description: "I'll provide a shipping address" },
  { value: "pickup" as const, label: "Pickup", description: "I'll meet you in person" },
  { value: "digital" as const, label: "Digital", description: "Gift card or digital delivery" },
];

const CURRENCY_OPTIONS = ["CAD", "USD"];

type ParsedData = {
  title: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  store_name: string | null;
  product_url: string;
};

type FormValues = {
  title: string;
  image_url: string;
  price: string;
  currency: string;
  product_url: string;
  store_name: string;
  priority: "high" | "medium" | "low";
  quantity: number;
  note: string;
  receiving_method: "pickup" | "shipping" | "either" | "digital";
  receiving_detail: string;
};

type Props = {
  mode: "create" | "edit";
  wishlistId: string;
  itemId?: string;
  defaultValues?: Partial<FormValues>;
};

export function WishItemForm({ mode, wishlistId, itemId, defaultValues }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2>(mode === "edit" || !!defaultValues?.title ? 2 : 1);
  const [urlInput, setUrlInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [values, setValues] = useState<FormValues>({
    title: defaultValues?.title ?? "",
    image_url: defaultValues?.image_url ?? "",
    price: defaultValues?.price ?? "",
    currency: defaultValues?.currency ?? "CAD",
    product_url: defaultValues?.product_url ?? "",
    store_name: defaultValues?.store_name ?? "",
    priority: defaultValues?.priority ?? "medium",
    quantity: defaultValues?.quantity ?? 1,
    note: defaultValues?.note ?? "",
    receiving_method: defaultValues?.receiving_method ?? "either",
    receiving_detail: defaultValues?.receiving_detail ?? "",
  });

  const [imageMode, setImageMode] = useState<"url" | "upload">(
    defaultValues?.image_url ? "url" : "upload"
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleParse() {
    if (!urlInput.trim()) return;
    setParsing(true);
    setParseError(null);

    try {
      const res = await fetch("/api/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const result = await res.json();

      if (result.success) {
        const d: ParsedData = result.data;
        setValues((prev) => ({
          ...prev,
          title: d.title ?? prev.title,
          image_url: d.image_url ?? prev.image_url,
          price: d.price != null ? String(d.price) : prev.price,
          currency: d.currency ?? prev.currency,
          store_name: d.store_name ?? prev.store_name,
          product_url: d.product_url,
        }));
        if (d.image_url) setImageMode("url");
      } else {
        setParseError(result.error ?? "Couldn't extract product info. Please fill in the details below.");
      }
    } catch {
      setParseError("Request failed. Please fill in the details below.");
    } finally {
      setParsing(false);
      setStep(2);
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setImageError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${wishlistId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("item-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("item-images")
        .getPublicUrl(path);

      set("image_url", urlData.publicUrl);
      setImageMode("url");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setImageError(`Image upload failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;
    setLoading(true);
    setError(null);

    const payload = {
      title: values.title.trim(),
      image_url: values.image_url || null,
      price: values.price ? parseFloat(values.price) : null,
      currency: values.currency,
      product_url: values.product_url || null,
      store_name: values.store_name || null,
      priority: values.priority,
      quantity: values.quantity,
      note: values.note || null,
      receiving_method: values.receiving_method,
      receiving_detail: values.receiving_detail || null,
    };

    if (mode === "create") {
      const { error: err } = await supabase
        .from("wish_items")
        .insert({ ...payload, wishlist_id: wishlistId });

      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { error: err } = await supabase
        .from("wish_items")
        .update(payload)
        .eq("id", itemId!);

      if (err) { setError(err.message); setLoading(false); return; }

      const hasNonQuantityChanges =
        payload.title !== defaultValues?.title ||
        String(payload.price ?? "") !== String(defaultValues?.price ?? "") ||
        (payload.image_url ?? "") !== (defaultValues?.image_url ?? "") ||
        (payload.product_url ?? "") !== (defaultValues?.product_url ?? "") ||
        (payload.store_name ?? "") !== (defaultValues?.store_name ?? "") ||
        (payload.note ?? "") !== (defaultValues?.note ?? "");

      if (hasNonQuantityChanges) {
        fetch("/api/reservations/notify-item-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        });
      }
    }

    router.push(`/wishlist/${wishlistId}`);
    router.refresh();
  }

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Product URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleParse())}
              placeholder="https://www.amazon.ca/..."
              autoFocus
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={handleParse}
              disabled={parsing || !urlInput.trim()}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {parsing ? "Finding…" : "Find Item"}
            </button>
          </div>
          {parseError && <p className="text-sm text-amber-600">{parseError}</p>}
        </div>

        <button
          type="button"
          onClick={() => setStep(2)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
        >
          Enter details manually →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {parseError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          {parseError}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Item Name *</label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. AirPods Pro (2nd Gen)"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Image */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Image <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        {imageMode === "url" && values.image_url ? (
          <div className="space-y-2">
            <div className="w-24 h-24 rounded-lg border border-border overflow-hidden">
              <img src={values.image_url} alt="Preview" className="w-full h-full object-contain" />
            </div>
            <button
              type="button"
              onClick={() => { set("image_url", ""); setImageMode("upload"); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
            >
              Change image
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-lg border-2 border-dashed border-border px-4 py-8 text-sm text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Click to upload image"}
            </button>
            {imageError && <p className="text-sm text-destructive">{imageError}</p>}
          </>
        )}
      </div>

      {/* Price + Currency */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Price <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="0.00"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={values.currency}
            onChange={(e) => set("currency", e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Store + Product URL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Store <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={values.store_name}
            onChange={(e) => set("store_name", e.target.value)}
            placeholder="e.g. Amazon"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Product URL <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            type="url"
            value={values.product_url}
            onChange={(e) => set("product_url", e.target.value)}
            placeholder="https://..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Priority</label>
        <div className="flex gap-2">
          {PRIORITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex-1 text-center rounded-lg border px-3 py-2 text-sm cursor-pointer transition-colors",
                values.priority === opt.value
                  ? "border-foreground bg-secondary font-medium"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <input
                type="radio"
                name="priority"
                value={opt.value}
                checked={values.priority === opt.value}
                onChange={() => set("priority", opt.value)}
                className="hidden"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Quantity</label>
        <input
          type="number"
          min="1"
          value={values.quantity}
          onChange={(e) => set("quantity", Math.max(1, parseInt(e.target.value) || 1))}
          className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Receiving method */}
      <div className="space-y-2">
        <label className="text-sm font-medium">How would you like to receive it?</label>
        <div className="space-y-2">
          {RECEIVING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                values.receiving_method === opt.value
                  ? "border-foreground bg-secondary"
                  : "border-border hover:bg-secondary/50"
              )}
            >
              <input
                type="radio"
                name="receiving_method"
                value={opt.value}
                checked={values.receiving_method === opt.value}
                onChange={() => set("receiving_method", opt.value)}
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

      {/* Receiving detail */}
      {(values.receiving_method === "shipping" || values.receiving_method === "pickup") && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {values.receiving_method === "shipping" ? "Shipping notes" : "Pickup details"}
            <span className="text-muted-foreground font-normal"> (optional)</span>
          </label>
          <textarea
            value={values.receiving_detail}
            onChange={(e) => set("receiving_detail", e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      )}

      {/* Note */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Note <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={values.note}
          onChange={(e) => set("note", e.target.value)}
          rows={2}
          placeholder="Any size, color, or preference…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
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
          disabled={loading || uploading || !values.title.trim()}
          className="flex-1 rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Saving…" : mode === "create" ? "Add to Wishlist" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
