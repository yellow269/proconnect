import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticPages = [
    { url: siteConfig.url, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${siteConfig.url}/search`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${siteConfig.url}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteConfig.url}/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  const { data: professionals } = await supabase
    .from("professional_profiles")
    .select("slug, updated_at")
    .eq("available", true)
    .limit(500);

  const proPages = (professionals ?? []).map((pro) => ({
    url: `${siteConfig.url}/pro/${pro.slug}`,
    lastModified: new Date(pro.updated_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...proPages];
}
