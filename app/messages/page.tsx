"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface Conversation {
  id: string;
  customer_id: string;
  professional_id: string;
  updated_at: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  other_user: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get conversations for this user
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, customer_id, professional_id, updated_at")
        .or(`customer_id.eq.${user.id},professional_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (!convs || convs.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get the other user's profile for each conversation
      const enriched = await Promise.all(
        convs.map(async (conv) => {
          const otherId =
            conv.customer_id === user.id
              ? conv.professional_id
              : conv.customer_id;

          const { data: otherProfile } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", otherId)
            .single();

          // Get last message
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("message, created_at, sender_id")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count (messages from other user that are not read)
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .neq("sender_id", user.id)
            .is("read_at", null);

          return {
            id: conv.id,
            customer_id: conv.customer_id,
            professional_id: conv.professional_id,
            updated_at: conv.updated_at,
            last_message: lastMsg?.message ?? null,
            last_message_at: lastMsg?.created_at ?? null,
            unread_count: unreadCount ?? 0,
            other_user: otherProfile ?? {
              id: otherId,
              full_name: "User",
              avatar_url: null,
            },
          };
        })
      );

      // Sort by last message time
      enriched.sort((a, b) => {
        const aTime = a.last_message_at ?? a.updated_at;
        const bTime = b.last_message_at ?? b.updated_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(enriched);
      setLoading(false);
    }

    load();
  }, [supabase, router]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl p-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="mt-4 text-slate-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-bold">Messages</h1>

      {conversations.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-lg font-semibold">No messages yet</h2>
          <p className="mt-2 text-slate-500">
            Message a professional to start a conversation.
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y rounded-lg border bg-white shadow-sm">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-4 p-4 transition hover:bg-slate-50"
            >
              {conv.other_user.avatar_url ? (
                <img
                  src={conv.other_user.avatar_url}
                  alt={conv.other_user.full_name}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                  {conv.other_user.full_name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {conv.other_user.full_name}
                  </h3>
                  {conv.last_message_at && (
                    <span className="ml-2 shrink-0 text-xs text-slate-400">
                      {new Date(conv.last_message_at).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                {conv.last_message && (
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {conv.last_message}
                  </p>
                )}
              </div>

              {conv.unread_count > 0 && (
                <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {conv.unread_count}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
