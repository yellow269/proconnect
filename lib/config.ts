export const siteConfig = {
  name: "ProConnect",
  description: "Find trusted local professionals and get the job done.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
