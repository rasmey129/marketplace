"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, PriceUnit } from "@localserve/shared";
import { fetchCategories } from "@localserve/shared";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function PostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "",
    category_id: "",
    description: "",
    price: "",
    price_unit: "quote" as PriceUnit,
    city: "",
    service_radius_km: "25",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/post");
  }, [loading, user, router]);

  useEffect(() => {
    fetchCategories(getSupabase()).then(setCategories).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    const supabase = getSupabase();
    try {
      const photos: string[] = [];
      for (const file of files.slice(0, 6)) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("listing-photos")
          .upload(path, file);
        if (upErr) throw upErr;
        photos.push(
          supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl
        );
      }

      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // location optional
      }

      const { data, error } = await supabase
        .from("listings")
        .insert({
          provider_id: user.id,
          category_id: Number(form.category_id),
          title: form.title,
          description: form.description,
          price: form.price_unit === "quote" || !form.price ? null : Number(form.price),
          price_unit: form.price_unit,
          photos,
          city: form.city || null,
          lat,
          lng,
          service_radius_km: Number(form.service_radius_km) || 25,
        })
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("profiles").update({ is_provider: true }).eq("id", user.id);
      router.push(`/listing/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (loading || !user) return null;

  const inputCls =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold">Post a service</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Tell your neighbors what you offer. Your listing appears in local search right away.
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          required
          placeholder="Title — e.g. Full interior & exterior detail"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={inputCls}
        />
        <select
          required
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          className={inputCls}
        >
          <option value="">Choose a category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <textarea
          required
          rows={5}
          placeholder="Describe your service, experience, and what's included…"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputCls}
        />
        <div className="flex gap-3">
          <select
            value={form.price_unit}
            onChange={(e) => setForm({ ...form, price_unit: e.target.value as PriceUnit })}
            className={inputCls}
          >
            <option value="quote">Price on request</option>
            <option value="fixed">Fixed price</option>
            <option value="hourly">Hourly rate</option>
          </select>
          {form.price_unit !== "quote" && (
            <input
              required
              type="number"
              min="1"
              step="0.01"
              placeholder="Price ($)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={inputCls}
            />
          )}
        </div>
        <div className="flex gap-3">
          <input
            placeholder="City / area — e.g. Long Beach, CA"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={inputCls}
          />
          <input
            type="number"
            min="1"
            max="200"
            value={form.service_radius_km}
            onChange={(e) => setForm({ ...form, service_radius_km: e.target.value })}
            className={`${inputCls} max-w-28`}
            title="Service radius (km)"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Photos (up to 6)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="text-sm"
          />
        </div>
        <button
          disabled={busy}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Publishing…" : "Publish listing"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
