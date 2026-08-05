import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Favorite = {
  professional_id: string;
  professional_profiles: {
    business_name: string | null;
    user_id: string;
  } | null;
};

export default async function FavoritesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Favorites</h1>
        <p>Please log in.</p>
      </main>
    );
  }

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select(`
      professional_id,
      professional_profiles (
        business_name,
        user_id
      )
    `)
    .eq("customer_id", user.id);

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <h1 className="text-3xl font-bold">Favorites</h1>
        <p className="text-red-500">{error.message}</p>
      </main>
    );
  }

  const typedFavorites = (favorites ?? []) as Favorite[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-3xl font-bold">Favorite Professionals</h1>

      {typedFavorites.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow">
          <h2 className="text-xl font-semibold">
            No favorites yet
          </h2>

          <p className="mt-2 text-slate-500">
            Save professionals here so you can find them later.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {typedFavorites.map((favorite) => (
            <div
              key={favorite.professional_id}
              className="rounded-lg border bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold">
                {favorite.professional_profiles?.business_name ?? "Professional"}
              </h2>

              <div className="mt-6 flex gap-3">
                <Link
                  href={`/dashboard/profile/${favorite.professional_id}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  View Profile
                </Link>

                <Link
                  href="/messages"
                  className="rounded-lg border px-4 py-2 hover:bg-slate-100"
                >
                  Message
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}