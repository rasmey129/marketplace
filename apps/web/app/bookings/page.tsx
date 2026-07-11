"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookingRequest, BookingStatus } from "@localserve/shared";
import { fetchBookings, updateBookingStatus } from "@localserve/shared";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  accepted: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  cancelled: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  completed: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

export default function BookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/bookings");
    if (user) {
      fetchBookings(getSupabase(), user.id)
        .then(setBookings)
        .finally(() => setReady(true));
    }
  }, [loading, user, router]);

  async function setStatus(id: string, status: BookingStatus) {
    await updateBookingStatus(getSupabase(), id, status);
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status } : b)));
  }

  if (loading || !user) return null;

  const incoming = bookings.filter((b) => b.provider_id === user.id);
  const outgoing = bookings.filter((b) => b.customer_id === user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">Bookings</h1>
      {ready && bookings.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
          No booking requests yet.
        </p>
      )}
      {incoming.length > 0 && (
        <Section title="Requests for your services">
          {incoming.map((b) => (
            <BookingRow key={b.id} booking={b} role="provider" onSetStatus={setStatus} />
          ))}
        </Section>
      )}
      {outgoing.length > 0 && (
        <Section title="Your requests">
          {outgoing.map((b) => (
            <BookingRow key={b.id} booking={b} role="customer" onSetStatus={setStatus} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
      {children}
    </section>
  );
}

function BookingRow({
  booking: b,
  role,
  onSetStatus,
}: {
  booking: BookingRequest;
  role: "provider" | "customer";
  onSetStatus: (id: string, status: BookingStatus) => void;
}) {
  const other = role === "provider" ? b.customer : b.provider;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/listing/${b.listing_id}`} className="font-medium hover:underline">
          {b.listing?.title ?? "Listing"}
        </Link>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
          {b.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        {role === "provider" ? "From" : "With"} {other?.full_name || "user"} ·{" "}
        {new Date(b.requested_at).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        {b.address ? ` · ${b.address}` : ""}
      </p>
      {b.details && <p className="mt-2 text-sm">{b.details}</p>}
      <div className="mt-3 flex gap-2 text-sm">
        {role === "provider" && b.status === "pending" && (
          <>
            <ActionBtn onClick={() => onSetStatus(b.id, "accepted")} variant="primary">
              Accept
            </ActionBtn>
            <ActionBtn onClick={() => onSetStatus(b.id, "declined")} variant="danger">
              Decline
            </ActionBtn>
          </>
        )}
        {role === "provider" && b.status === "accepted" && (
          <ActionBtn onClick={() => onSetStatus(b.id, "completed")} variant="primary">
            Mark completed
          </ActionBtn>
        )}
        {role === "customer" && (b.status === "pending" || b.status === "accepted") && (
          <ActionBtn onClick={() => onSetStatus(b.id, "cancelled")} variant="danger">
            Cancel
          </ActionBtn>
        )}
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: "primary" | "danger";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        variant === "primary"
          ? "rounded-full bg-emerald-600 px-4 py-1.5 font-medium text-white hover:bg-emerald-700"
          : "rounded-full border border-red-300 px-4 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
      }
    >
      {children}
    </button>
  );
}
