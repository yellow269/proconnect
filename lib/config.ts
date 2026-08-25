export const siteConfig = {
  name: "ProConnect",
  description:
    "Find trusted local professionals in South Africa. Compare quotes, read reviews, and hire with confidence for plumbing, electrical, painting, and more.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://proconect.co.za",
} as const;
