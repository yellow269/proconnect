"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ChatInputProps = {
  conversationId: string;
};

export default function ChatInput({
  conversationId,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function sendMessage(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!message.trim()) return;

    setLoading(true);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      alert("Failed to send message");
      return;
    }

    setMessage("");

    // Refresh the page so the new message appears
    router.refresh();
  }

  return (
    <form
      onSubmit={sendMessage}
      className="mt-6 flex gap-3"
    >
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 rounded-lg border p-3"
      />

      <button
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}