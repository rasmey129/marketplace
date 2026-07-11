"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Category } from "@localserve/shared";

export function BrowseControls({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const activeCategory = params.get("category");
  const nearMe = params.has("lat");

  function push(update: (p: URLSearchParams) => void) {
    const next = new URLSearchParams(params.toString());
    update(next);
    router.push(`/?${next.toString()}`);
  }

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          push((p) => (q ? p.set("q", q) : p.delete("q")));
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search services — detailing, plumbing, moving…"
          className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900">
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            if (nearMe) {
              push((p) => {
                p.delete("lat");
                p.delete("lng");
              });
              return;
            }
            navigator.geolocation?.getCurrentPosition((pos) =>
              push((p) => {
                p.set("lat", pos.coords.latitude.toFixed(5));
                p.set("lng", pos.coords.longitude.toFixed(5));
              })
            );
          }}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm ${
            nearMe
              ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950"
              : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          📍 Near me
        </button>
      </form>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <CategoryPill
          label="All"
          active={!activeCategory}
          onClick={() => push((p) => p.delete("category"))}
        />
        {categories.map((c) => (
          <CategoryPill
            key={c.id}
            label={`${c.icon} ${c.name}`}
            active={activeCategory === String(c.id)}
            onClick={() => push((p) => p.set("category", String(c.id)))}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm whitespace-nowrap ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {label}
    </button>
  );
}
