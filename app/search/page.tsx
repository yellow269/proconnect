import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { MapPin, Star, Briefcase } from "lucide-react";
import { MessageButton } from "@/components/messages/MessageButton";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; location?: string }>;
}) {
  const params = await searchParams;
  const categorySlug = params.category ?? "";
  const location = params.location ?? "";
  const query = params.q ?? "";

  const supabase = await createClient();

  // Get all categories for filters
  const { data: allCategories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("name");

  // Get category name and ID if slug provided
  let categoryName = "All Services";
  let categoryId: string | null = null;
  if (categorySlug) {
    const cat = (allCategories ?? []).find((c) => c.slug === categorySlug);
    if (cat) {
      categoryName = cat.name;
      categoryId = cat.id;
    }
  }

  // Build query — use category_id for reliable filtering
  let dbQuery = supabase
    .from("professional_profiles")
    .select(
      `
      user_id, business_name, slug, bio, verified, average_rating, review_count,
      profiles!inner(full_name, avatar_url, city, province),
      services(id, title, price_from, category_id)
    `
    )
    .eq("available", true);

  if (categoryId) {
    dbQuery = dbQuery.eq("services.category_id", categoryId);
  }

  if (location) {
    dbQuery = dbQuery.ilike("profiles.city", `%${location}%`);
  }

  if (query) {
    dbQuery = dbQuery.ilike("business_name", `%${query}%`);
  }

  const { data: professionals, error: searchError } = await dbQuery.limit(20);

  // Get current user's favorites
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let favoriteIds = new Set<string>();
  if (user) {
    const { data: favs } = await supabase
      .from("favorites")
      .select("professional_id")
      .eq("customer_id", user.id);
    favoriteIds = new Set((favs ?? []).map((f) => f.professional_id));
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {categoryName}
          </h1>
          <p className="mt-2 text-slate-500">
            {searchError
              ? "Unable to load professionals. Please try again."
              : `${professionals?.length ?? 0} professional${(professionals?.length ?? 0) !== 1 ? "s" : ""} found`}
          </p>
        </div>

        {/* Filters — show top categories from database */}
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/search"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !categorySlug
                ? "bg-brand-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            }`}
          >
            All
          </Link>
          {(allCategories ?? []).slice(0, 12).map((cat) => (
            <Link
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                categorySlug === cat.slug
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Results */}
        {searchError ? (
          <div className="rounded-2xl border border-dashed border-red-300 bg-white p-12 text-center dark:border-red-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">
              Unable to load professionals
            </h2>
            <p className="mt-2 text-sm text-red-500">
              Please try again later.
            </p>
          </div>
        ) : !professionals || professionals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
              No professionals found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Try adjusting your search or browse categories.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((pro) => {
              const profile = Array.isArray(pro.profiles)
                ? pro.profiles[0]
                : pro.profiles;

              const services = (pro.services ?? [])
                .slice(0, 3)
                .map((s: { title: string }) => s.title)
                .join(", ");

              return (
                <Link
                  key={pro.user_id}
                  href={`/pro/${pro.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start gap-4">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        className="h-14 w-14 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xl font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                        {profile?.full_name?.charAt(0) ?? "P"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-bold text-slate-900 group-hover:text-brand-600 dark:text-white">
                          {pro.business_name}
                        </h3>
                        {pro.verified && (
                          <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        {profile?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {profile.city}
                          </span>
                        )}
                        {pro.average_rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {pro.average_rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {services && (
                        <p className="mt-2 line-clamp-1 text-xs text-slate-400">
                          {services}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3">
                        <MessageButton professionalId={pro.user_id} />
                        <FavoriteButton
                          professionalId={pro.user_id}
                          initialFavorited={favoriteIds.has(pro.user_id)}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
