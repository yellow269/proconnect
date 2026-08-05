import { Header } from "@/components/layout/header";
import { Hero } from "@/components/marketing/hero";
import { createClient } from "@/lib/supabase/server";
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
  "fence": Link,
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
  "keyboard": Type,
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

        <section
          id="categories"
          className="border-y border-slate-100 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-semibold text-brand-600">
                  Explore services
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Help for every project
                </h2>
              </div>
            </div>
            <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-5">
              {displayCategories.map(({ id, name, slug, icon }) => {
                const Icon = getIcon(icon);
                return (
                  <a
                    href={`/search?category=${encodeURIComponent(slug)}`}
                    key={id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-soft dark:border-slate-700 dark:bg-slate-900"
                  >
                    <Icon className="h-7 w-7 text-brand-600" />
                    <p className="mt-5 font-semibold">{name}</p>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-4 py-24 sm:px-6"
        >
          <div className="text-center">
            <p className="font-semibold text-brand-600">Simple and safe</p>
            <h2 className="mt-2 text-3xl font-bold">
              From task to done in three steps
            </h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              [
                "1",
                "Tell us what you need",
                "Post your job in minutes with the details professionals need.",
              ],
              [
                "2",
                "Compare your quotes",
                "Review profiles, ratings, portfolios, and transparent quotes.",
              ],
              [
                "3",
                "Hire with confidence",
                "Choose your professional and manage everything in one place.",
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
          <div className="mt-16 flex items-center justify-center gap-2 rounded-2xl bg-brand-50 p-5 text-center text-sm font-medium text-brand-950 dark:bg-brand-950 dark:text-brand-100">
            <Shield className="h-5 w-5" />
            Profiles, reviews, and account access are protected at every step.
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="rounded-3xl bg-brand-600 px-6 py-16 text-center text-white sm:px-12">
            <h2 className="text-3xl font-bold">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              Join thousands of professionals and clients building great things
              together on ProConnect.
            </p>
            <a
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-brand-600 transition hover:bg-brand-50"
            >
              Get started free <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
