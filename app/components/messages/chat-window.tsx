"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type Props = {
  conversationId: string;
  userId: string;
  initialMessages: Message[];
};

export default function ChatWindow({
  conversationId,
  userId,
  initialMessages,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    const supabase = createClient();

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
          setMessages((current) => [
            ...current,
            payload.new as Message,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg p-4 ${
            message.sender_id === userId
              ? "ml-16 bg-blue-600 text-white"
              : "mr-16 bg-slate-100"
          }`}
        >
          {message.message}
        </div>
      ))}
    </div>
  );
}