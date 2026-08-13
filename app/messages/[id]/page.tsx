import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ChatPage from "@/app/components/messages/chat-page";

export const metadata = {
  title: "Conversation | ProConnect",
};

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

  if (!user) redirect("/login");

  // Get conversation and verify participation
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, customer_id, professional_id")
    .eq("id", id)
    .single();

  if (
    !conversation ||
    (conversation.customer_id !== user.id &&
      conversation.professional_id !== user.id)
  ) {
    notFound();
  }

  // Get other user info
  const otherId =
    conversation.customer_id === user.id
      ? conversation.professional_id
      : conversation.customer_id;

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", otherId)
    .single();

  // Get messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, message, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return (
    <ChatPage
      conversationId={id}
      userId={user.id}
      otherUser={
        otherProfile ?? { full_name: "User", avatar_url: null }
      }
      initialMessages={(messages ?? []).map((m) => ({
        id: m.id,
        sender_id: m.sender_id,
        message: m.message,
        created_at: m.created_at,
      }))}
    />
  );
}
