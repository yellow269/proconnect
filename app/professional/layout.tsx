import { DashboardNav } from "@/components/professional/dashboard-nav";

export default function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex gap-8 py-8">
          {/* Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24">
              <h2 className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Professional Dashboard
              </h2>
              <DashboardNav />
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
