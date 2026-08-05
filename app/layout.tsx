import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { siteConfig } from "@/lib/config";

const inter = Inter({ subsets: ["latin"], display: "swap" });
export const metadata: Metadata = { metadataBase: new URL(siteConfig.url), title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` }, description: siteConfig.description, openGraph: { type: "website", title: siteConfig.name, description: siteConfig.description, siteName: siteConfig.name }, twitter: { card: "summary_large_image" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body className={inter.className}><ThemeProvider>{children}</ThemeProvider></body></html>; }
