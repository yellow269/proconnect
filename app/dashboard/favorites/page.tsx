import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MapPin, Star, Heart } from "lucide-react";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";
import { MessageButton } from "@/components/messages/MessageButton";

export const metadata = {
  title: "Favorite Professionals | ProConnect",
};

export default async function FavoritesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      `
      professional_id,
      created_at,
      professional_profiles!favorites_professional_id_fkey(
        user_id, business_name, slug, average_rating, review_count, verified, available,
        profiles:user_id(full_name, avatar_url, city, province)
      )
    `
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const typedFavorites = (favorites ?? []) as unknown as {
    professional_id: string;
    created_at: string;
    professional_profiles: {
      user_id: string;
      business_name: string | null;
      slug: string | null;
      average_rating: number | null;
      review_count: number | null;
      verified: boolean | null;
      available: boolean | null;
      profiles: {
        full_name: string;
        avatar_url: string | null;
        city: string | null;
        province: string | null;
      } | null;
    } | null;
  }[];

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Favorite Professionals</h1>
          <p className="mt-1 text-slate-500">
            {typedFavorites.length > 0
              ? `${typedFavorites.length} saved professional${typedFavorites.length !== 1 ? "s" : ""}`
              : "Save professionals you like so you can easily find them again."}
          </p>
        </div>
      </div>

      {typedFavorites.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-white p-8 text-center shadow">
          <Heart className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-lg font-semibold">No favorite professionals yet</h2>
          <p className="mt-2 text-slate-500">
            Save professionals you like so you can easily find them again.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Find Professionals
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {typedFavorites.map((fav) => {
            const pro = fav.professional_profiles;
            const profile = pro?.profiles;
            const name = profile?.full_name ?? "Professional";
            const rating = pro?.average_rating ?? 0;
            const reviewCount = pro?.review_count ?? 0;

            return (
              <div
                key={fav.professional_id}
                className="rounded-lg border bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={name}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {pro?.business_name ?? name}
                      </h3>
                      {pro?.verified && (
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      {profile?.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {profile.city}{profile.province ? `, ${profile.province}` : ""}
                        </span>
                      )}
                      {rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {rating.toFixed(1)}
                        </span>
                      )}
                      {reviewCount > 0 && (
                        <span>({reviewCount})</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/pro/${pro?.slug ?? fav.professional_id}`}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    View Profile
                  </Link>
                  <MessageButton professionalId={fav.professional_id} />
                  <div className="ml-auto">
                    <FavoriteButton
                      professionalId={fav.professional_id}
                      initialFavorited={true}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
