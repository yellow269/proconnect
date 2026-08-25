import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/marketing/hero";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import {
  Award,
  BarChart3,
  Briefcase,
  Brush,
  Building2,
  Calculator,
  Calendar,
  Camera,
  Car,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Cloud,
  Code,
  Cpu,
  Database,
  DollarSign,
  Download,
  Factory,
  FileText,
  Film,
  Gamepad2,
  GraduationCap,
  Globe,
  Hammer,
  Headphones,
  HeartPulse,
  HelpCircle,
  Home,
  Layout,
  Leaf,
  Link,
  Mail,
  Mic,
  Monitor,
  MoreHorizontal,
  Music,
  Network,
  Package,
  Palette,
  PenTool,
  PieChart,
  Printer,
  Radio,
  Ruler,
  Search,
  Server,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Signal,
  Smartphone,
  Table,
  Target,
  TrendingUp,
  Truck,
  Type,
  University,
  User,
  UserPlus,
  Users,
  Video,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const metadata: Metadata = {
  title: "ProConnect — Find Trusted Local Professionals",
  description:
    "Connect with verified local professionals in South Africa. Compare quotes, read reviews, and hire with confidence for plumbing, electrical, painting, and more.",
  openGraph: {
    title: "ProConnect — Find Trusted Local Professionals",
    description:
      "Connect with verified local professionals in South Africa. Compare quotes, read reviews, and hire with confidence.",
    url: "https://proconect.co.za",
    siteName: "ProConnect",
    type: "website",
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProConnect — Find Trusted Local Professionals",
    description:
      "Connect with verified local professionals in South Africa. Compare quotes, read reviews, and hire with confidence.",
  },
  keywords: [
    "find professionals",
    "local services",
    "South Africa",
    "hire a professional",
    "plumber near me",
    "electrician near me",
    "contractor",
    "quotes",
    "home services",
    "proconect",
  ],
  alternates: {
    canonical: "https://proconect.co.za",
  },
};

const iconMap: Record<string, LucideIcon> = {
  award: Award,
  "bar-chart": BarChart3,
  briefcase: Briefcase,
  brush: Brush,
  building: Building2,
  calculator: Calculator,
  calendar: Calendar,
  camera: Camera,
  car: Car,
  "check-circle": CheckCircle,
  clipboard: ClipboardList,
  cloud: Cloud,
  code: Code,
  "dollar-sign": DollarSign,
  download: Download,
  database: Database,
  cpu: Cpu,
  eye: Search,
  fence: Link,
  factory: Factory,
  file: FileText,
  "file-text": FileText,
  film: Film,
  flame: Zap,
  gamepad: Gamepad2,
  "graduation-cap": GraduationCap,
  globe: Globe,
  hammer: Hammer,
  headphones: Headphones,
  "heart-pulse": HeartPulse,
  heart: CheckCircle,
  "help-circle": HelpCircle,
  home: Home,
  keyboard: Type,
  layout: Layout,
  leaf: Leaf,
  link: Link,
  lock: Shield,
  mail: Mail,
  mic: Mic,
  monitor: Monitor,
  "more-horizontal": MoreHorizontal,
  music: Music,
  navigation: Target,
  network: Network,
  package: Package,
  palette: Palette,
  paintbrush: Brush,
  "pen-tool": PenTool,
  "pie-chart": PieChart,
  printer: Printer,
  radio: Radio,
  ruler: Ruler,
  scissors: Brush,
  search: Search,
  server: Server,
  settings: Settings,
  shield: Shield,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  signal: Signal,
  smartphone: Smartphone,
  sofa: Package,
  sparkles: Zap,
  sun: Zap,
  table: Table,
  target: Target,
  thermometer: Zap,
  "trending-up": TrendingUp,
  "trash-2": MoreHorizontal,
  truck: Truck,
  trees: Leaf,
  type: Type,
  university: University,
  "user-check": User,
  user: User,
  "user-plus": UserPlus,
  users: Users,
  utensils: Package,
  video: Video,
  wifi: Wifi,
  wine: Package,
  wrench: Wrench,
  "x-circle": MoreHorizontal,
  "door-open": Home,
  bike: Car,
  square: Package,
  axe: Hammer,
  apple: CheckCircle,
  hand: User,
  "book-open": FileText,
  book: FileText,
  edit: FileText,
};

function getIcon(name: string | null): LucideIcon {
  if (!name) return Briefcase;
  return iconMap[name] || Briefcase;
}

export default async function HomePage() {
  const supabase = await createClient();

  let { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .order("name");

  if (!categories || categories.length === 0) {
    await supabase.rpc("seed_categories");
    const result = await supabase
      .from("categories")
      .select("id, name, slug, icon")
      .order("name");
    categories = result.data;
  }

  const displayCategories = categories ?? [];

  return (
    <>
      <Header />
      <main>
        <Hero />

        {/* Categories */}
        {displayCategories.length > 0 && (
          <section
            id="categories"
            className="border-y border-slate-100 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/40"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="text-center">
                <p className="font-semibold text-brand-600">
                  Explore services
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Find help for every project
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
                  Browse by category to find the right professional for your
                  needs.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
                {displayCategories.map(({ id, name, slug, icon }) => {
                  const Icon = getIcon(icon);
                  return (
                    <a
                      href={`/search?category=${encodeURIComponent(slug)}`}
                      key={id}
                      className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900 dark:hover:border-brand-800"
                    >
                      <Icon className="h-7 w-7 text-brand-600 transition group-hover:scale-110" />
                      <p className="mt-5 font-semibold">{name}</p>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-4 py-24 sm:px-6"
        >
          <div className="text-center">
            <p className="font-semibold text-brand-600">Simple and safe</p>
            <h2 className="mt-2 text-3xl font-bold">
              From task to done in three steps
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
              Whether you need a plumber or an electricarian, ProConnect makes
              it easy to find and hire the right person.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              [
                "1",
                "Tell us what you need",
                "Post your job in minutes with the details professionals need to give you an accurate quote.",
              ],
              [
                "2",
                "Compare your quotes",
                "Review profiles, ratings, portfolios, and transparent quotes from verified professionals.",
              ],
              [
                "3",
                "Hire with confidence",
                "Choose your professional and manage everything — messaging, payments, and scheduling — in one place.",
              ],
            ].map(([n, t, d]) => (
              <div key={n} className="text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-600 font-bold text-white">
                  {n}
                </span>
                <h3 className="mt-5 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust section */}
        <section className="bg-slate-50 py-24 dark:bg-slate-900/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="font-semibold text-brand-600">
                  Built on trust
                </p>
                <h2 className="mt-2 text-3xl font-bold">
                  Why professionals and customers choose ProConnect
                </h2>
                <ul className="mt-6 space-y-4">
                  {[
                    "Every professional profile is verified before going live",
                    "Real reviews from real customers — no fake ratings",
                    "Secure messaging and payment handling",
                    "Transparent pricing with no hidden fees",
                    "Free for customers to post jobs and request quotes",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                      <span className="text-slate-600 dark:text-slate-300">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-bold">Your safety matters</p>
                    <p className="text-sm text-slate-500">
                      Profiles, reviews, and accounts are protected at every
                      step.
                    </p>
                  </div>
                </div>
                <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-brand-900 dark:bg-brand-950 dark:text-brand-100">
                  ProConnect is free for customers. Professionals pay a
                  transparent monthly subscription for access to leads and
                  tools — no commissions, no surprises.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="rounded-3xl bg-brand-600 px-6 py-16 text-center text-white sm:px-12">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              Whether you need work done or you&apos;re a professional looking
              for clients, ProConnect is the place to be.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/search"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-brand-600 transition hover:bg-brand-50"
              >
                Find a Professional
              </a>
              <a
                href="/register"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Join as a Professional
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
