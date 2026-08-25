import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  Search,
  Star,
  Shield,
  Users,
  Briefcase,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_15%,rgba(11,140,233,.16),transparent_35%)]" />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:border-brand-950 dark:bg-brand-950 dark:text-brand-100">
              <Star className="h-4 w-4 fill-current" />
              Trusted by local communities
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find the right{" "}
              <span className="text-brand-600">professional</span> for every
              job.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600 dark:text-slate-300">
              Connect with verified local professionals. Compare quotes, read
              reviews, and hire with confidence — all in one place.
            </p>

            {/* Search form */}
            <form
              action="/search"
              className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-slate-200 sm:flex-row dark:bg-slate-900 dark:ring-slate-800"
            >
              <label className="flex flex-1 items-center gap-2 px-2">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  name="q"
                  aria-label="Service"
                  placeholder="What service do you need?"
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <label className="flex items-center gap-2 border-t px-2 sm:border-l sm:border-t-0 dark:border-slate-700">
                <MapPin className="h-5 w-5 text-slate-400" />
                <input
                  name="location"
                  aria-label="Location"
                  placeholder="Your city"
                  className="h-11 w-full bg-transparent text-sm outline-none sm:w-28"
                />
              </label>
              <button className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
                Search
              </button>
            </form>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap gap-5 text-sm text-slate-600 dark:text-slate-300">
              {[
                "Verified professionals",
                "No obligation quotes",
                "Secure platform",
              ].map((x) => (
                <span key={x} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-600" />
                  {x}
                </span>
              ))}
            </div>

            {/* Primary CTAs */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Find a Professional
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Join as a Professional
              </Link>
            </div>
          </div>

          {/* Right side — trust/stats visual */}
          <div className="hidden lg:block">
            <div className="relative rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 p-10 dark:from-brand-950 dark:to-brand-900">
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
                  <Shield className="h-8 w-8 text-brand-600" />
                  <p className="mt-3 text-2xl font-bold">100%</p>
                  <p className="text-sm text-slate-500">Verified profiles</p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
                  <Users className="h-8 w-8 text-brand-600" />
                  <p className="mt-3 text-2xl font-bold">Local</p>
                  <p className="text-sm text-slate-500">Professionals near you</p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
                  <Star className="h-8 w-8 text-brand-600" />
                  <p className="mt-3 text-2xl font-bold">Real</p>
                  <p className="text-sm text-slate-500">Reviews from clients</p>
                </div>
                <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
                  <Briefcase className="h-8 w-8 text-brand-600" />
                  <p className="mt-3 text-2xl font-bold">Free</p>
                  <p className="text-sm text-slate-500">To post a job</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
