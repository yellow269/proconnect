import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MessagesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p>Please log in.</p>
      </main>
    );
  }

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*")
    .or(`customer_id.eq.${user.id},professional_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      {error && (
        <p className="mt-6 text-red-500">{error.message}</p>
      )}

      {!conversations || conversations.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow">
          <h2 className="text-xl font-semibold">
            No conversations yet
          </h2>

          <p className="mt-2 text-slate-500">
            When you contact a professional or receive a message,
            your conversations will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {conversations.map((conversation) => (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="block rounded-lg border bg-white p-6 shadow-sm hover:bg-slate-50"
            >
              <h2 className="text-lg font-semibold">
                Conversation
              </h2>

              <p className="mt-2 text-slate-500">
                Started {new Date(conversation.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}