import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatInput from "@/app/components/messages/chat-input";
import ChatWindow from "@/app/components/messages/chat-window";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (
    !conversation ||
    (conversation.customer_id !== user.id &&
      conversation.professional_id !== user.id)
  ) {
    notFound();
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Conversation</h1>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {!messages || messages.length === 0 ? (
          <p className="text-slate-500">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          <ChatWindow
            conversationId={id}
            userId={user.id}
            initialMessages={messages.map((m) => ({
              id: m.id,
              sender_id: m.sender_id,
              message: m.message,
              created_at: m.created_at,
            }))}
          />
        )}

        <ChatInput conversationId={id} />
      </div>
    </main>
  );
}
