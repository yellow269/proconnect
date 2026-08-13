import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { StorefrontServices } from "./storefront-services";
import { ReviewsSection } from "@/components/storefront/reviews-section";
import { ShareBar } from "@/components/storefront/share-bar";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professional_profiles")
    .select("business_name, bio, profiles!inner(full_name)")
    .eq("slug", slug)
    .single();

  if (!pro) {
    return { title: "Professional Not Found" };
  }

  const name = pro.business_name || ((Array.isArray(pro.profiles) ? pro.profiles[0] : pro.profiles) as { full_name: string }).full_name;

  return {
    title: `${name} | ProConnect`,
    description:
      pro.bio ?? `${name} on ProConnect - Find trusted local professionals.`,
    openGraph: {
      title: `${name} | ProConnect`,
      description:
        pro.bio ?? `${name} on ProConnect - Find trusted local professionals.`,
    },
  };
}

export default async function StorefrontPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch professional profile with all related data
  const { data: professional } = await supabase
    .from("professional_profiles")
    .select(
      `
      user_id,
      business_name,
      slug,
      bio,
      verified,
      available,
      average_rating,
      review_count,
      profiles!inner(id, full_name, avatar_url, city, province),
      services(
        id, title, description, price_from, pricing_type, fixed_price,
        duration_minutes, image_url, sort_order, active,
        categories(id, name, slug)
      ),
      reviews(id, rating, comment, created_at, customer_id),
      professional_storefront_settings(
        whatsapp_number, custom_description, cover_image_url,
        service_area, show_portfolio, show_reviews
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (!professional) {
    notFound();
  }

  const profile = (Array.isArray(professional.profiles)
    ? professional.profiles[0]
    : professional.profiles) as {
    id: string;
    full_name: string;
    avatar_url: string | null;
    city: string | null;
    province: string | null;
  };

  const settings = professional.professional_storefront_settings as {
    whatsapp_number: string | null;
    custom_description: string | null;
    cover_image_url: string | null;
    service_area: string | null;
    show_portfolio: boolean;
    show_reviews: boolean;
  } | null;

  // Filter active services and sort by sort_order
  const activeServices = (professional.services ?? [])
    .filter((s: { active: boolean }) => s.active)
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);

  // Sort reviews by date, take first 10
  const reviews = (professional.reviews ?? [])
    .sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <StorefrontHeader
        fullName={profile.full_name}
        avatarUrl={profile.avatar_url}
        businessName={professional.business_name}
        slug={professional.slug}
        bio={settings?.custom_description ?? professional.bio}
        verified={professional.verified}
        categoryName={
          activeServices[0]?.categories?.name ?? null
        }
        city={profile.city}
        province={profile.province}
        averageRating={professional.average_rating}
        reviewCount={professional.review_count}
        whatsappNumber={settings?.whatsapp_number ?? null}
        serviceArea={settings?.service_area ?? null}
      />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Services */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Services
          </h2>
          <div className="mt-6">
            <StorefrontServices
              services={activeServices}
              professionalId={professional.user_id}
              professionalName={profile.full_name}
            />
          </div>
        </section>

        {/* Reviews */}
        {settings?.show_reviews !== false && reviews.length > 0 && (
          <section className="mt-12">
            <ReviewsSection
              reviews={reviews}
              averageRating={professional.average_rating}
              reviewCount={professional.review_count}
            />
          </section>
        )}

        {/* Share */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Share this profile
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Help others discover {professional.business_name}
          </p>
          <div className="mt-4">
            <ShareBar
              slug={professional.slug}
              businessName={professional.business_name}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
