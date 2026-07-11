"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", city: "", phone: "", bio: "" });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/profile");
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        city: profile.city ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
      });
    }
  }, [profile]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setSaved(false);
    await getSupabase().from("profiles").update(form).eq("id", user.id);
    await refreshProfile();
    setBusy(false);
    setSaved(true);
  }

  if (loading || !user) return null;

  const inputCls =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Your profile</h1>
      <form onSubmit={onSave} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Full name</span>
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">City / area</span>
          <input
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={inputCls}
            placeholder="e.g. Long Beach, CA"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Phone (shown after booking)</span>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Bio</span>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className={inputCls}
            placeholder="Tell customers about yourself and your experience…"
          />
        </label>
        <button
          disabled={busy}
          className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
        {saved && <p className="text-sm text-emerald-700">Profile saved.</p>}
      </form>
    </div>
  );
}
