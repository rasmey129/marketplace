"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Message } from "@localserve/shared";
import { fetchMessages, sendMessage } from "@localserve/shared";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/messages");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    fetchMessages(supabase, id).then(setMessages);

    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((ms) => (ms.some((m) => m.id === msg.id) ? ms : [...ms, msg]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !user) return;
    const body = draft.trim();
    setDraft("");
    const msg = await sendMessage(getSupabase(), id, user.id, body);
    setMessages((ms) => (ms.some((m) => m.id === msg.id) ? ms : [...ms, msg]));
  }

  if (loading || !user) return null;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto rounded-t-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
              m.sender_id === user.id
                ? "ml-auto bg-emerald-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={onSend}
        className="flex gap-2 rounded-b-xl border border-t-0 border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          className="w-full rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Send
        </button>
      </form>
    </div>
  );
}
