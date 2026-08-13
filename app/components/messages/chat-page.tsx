"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Message = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type OtherUser = {
  full_name: string;
  avatar_url: string | null;
};

export default function ChatPage({
  conversationId,
  userId,
  otherUser,
  initialMessages,
}: {
  conversationId: string;
  userId: string;
  otherUser: OtherUser;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    async function markRead() {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
      });
    }
    markRead();
  }, [conversationId]);

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((current) => {
            // Avoid duplicates
            if (current.some((m) => m.id === newMsg.id)) return current;
            return [...current, newMsg];
          });
          // Mark as read if from other person
          if (newMsg.sender_id !== userId) {
            fetch(`/api/conversations/${conversationId}/read`, {
              method: "POST",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId, supabase]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newMessage.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: trimmed,
        }),
      });

      if (!res.ok) {
        setError("Message could not be sent. Please try again.");
        setSending(false);
        return;
      }

      setNewMessage("");
    } catch {
      setError("Message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-white px-4 py-3">
        <Link
          href="/messages"
          className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {otherUser.avatar_url ? (
          <img
            src={otherUser.avatar_url}
            alt={otherUser.full_name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
            {otherUser.full_name.charAt(0).toUpperCase()}
          </div>
        )}
        <h2 className="font-semibold text-slate-900">{otherUser.full_name}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4">
        {messages.length === 0 && (
          <p className="mt-8 text-center text-sm text-slate-400">
            Start the conversation below.
          </p>
        )}

        <div className="space-y-3">
          {messages.map((msg) => {
            const isMine = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? "bg-blue-600 text-white"
                      : "bg-white text-slate-900 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isMine ? "text-blue-200" : "text-slate-400"
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString("en-ZA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t bg-white px-4 py-3"
      >
        {error && (
          <p className="absolute -top-8 left-4 text-xs text-red-600">{error}</p>
        )}
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
