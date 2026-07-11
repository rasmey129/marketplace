"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Listing } from "@localserve/shared";
import { createBookingRequest, getOrCreateConversation } from "@localserve/shared";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "./AuthProvider";

export function ListingActions({ listing }: { listing: Listing }) {
  const { user } = useAuth();
  const router = useRouter();
  const [showBooking, setShowBooking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ date: "", time: "", address: "", details: "" });

  const isOwner = user?.id === listing.provider_id;
  if (isOwner) {
    return (
      <p className="mt-4 rounded-lg bg-zinc-100 p-3 text-sm text-zinc-500 dark:bg-zinc-800">
        This is your listing.
      </p>
    );
  }

  function requireAuth(): boolean {
    if (!user) {
      router.push(`/login?next=/listing/${listing.id}`);
      return false;
    }
    return true;
  }

  async function onMessage() {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      const convo = await getOrCreateConversation(getSupabase(), listing, user!.id);
      router.push(`/messages/${convo.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  async function onBook(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth()) return;
    setBusy(true);
    setError(null);
    try {
      await createBookingRequest(getSupabase(), {
        listing,
        customerId: user!.id,
        requestedAt: new Date(`${form.date}T${form.time || "09:00"}`).toISOString(),
        address: form.address || undefined,
        details: form.details || undefined,
      });
      setDone(true);
      setShowBooking(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {done ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950">
          Booking request sent! Track it in{" "}
          <a href="/bookings" className="underline">Bookings</a>.
        </p>
      ) : (
        <>
          <button
            onClick={onMessage}
            disabled={busy}
            className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            💬 Message provider
          </button>
          <button
            onClick={() => requireAuth() && setShowBooking((s) => !s)}
            className="w-full rounded-lg border border-emerald-600 py-2.5 font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
          >
            📅 Request booking
          </button>
        </>
      )}
      {showBooking && !done && (
        <form onSubmit={onBook} className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <div className="flex gap-2">
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <input
            placeholder="Service address (optional)"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <textarea
            placeholder="Describe the job…"
            rows={3}
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
          <button
            disabled={busy}
            className="w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send request"}
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
