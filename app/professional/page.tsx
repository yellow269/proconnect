import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Calendar,
  Wrench,
  DollarSign,
  Clock,
  Store,
} from "lucide-react";

export default async function ProfessionalDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get professional profile
  const { data: pro } = await supabase
    .from("professional_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!pro) {
    redirect("/dashboard/profile");
  }

  // Get stats
  const [
    { count: totalBookings },
    { count: pendingBookings },
    { count: completedBookings },
    { data: revenueData },
    { data: upcomingBookings },
  ] = await Promise.all([
    supabase
      .from("service_bookings")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", user.id),
    supabase
      .from("service_bookings")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", user.id)
      .eq("status", "pending"),
    supabase
      .from("service_bookings")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("service_bookings")
      .select("total_amount")
      .eq("professional_id", user.id)
      .eq("payment_status", "paid"),
    supabase
      .from("service_bookings")
      .select(
        `
        id, booking_date, start_time, end_time, status, total_amount,
        services(title),
        customer_id
      `
      )
      .eq("professional_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("booking_date", new Date().toISOString().split("T")[0])
      .order("booking_date", { ascending: true })
      .limit(5),
  ]);

  const totalRevenue = revenueData?.reduce(
    (sum, b) => sum + (Number(b.total_amount) || 0),
    0
  ) ?? 0;

  const stats = [
    {
      label: "Total Bookings",
      value: totalBookings ?? 0,
      icon: Calendar,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300",
    },
    {
      label: "Pending",
      value: pendingBookings ?? 0,
      icon: Clock,
      color:
        "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300",
    },
    {
      label: "Completed",
      value: completedBookings ?? 0,
      icon: Wrench,
      color:
        "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300",
    },
    {
      label: "Revenue",
      value: `R${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color:
        "text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Professional Dashboard
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Welcome back, {pro.business_name}
      </p>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className={`inline-flex rounded-xl p-2.5 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/professional/services/new"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900"
        >
          <Wrench className="h-8 w-8 text-brand-600" />
          <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
            Add Service
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Create a new service offering
          </p>
        </Link>

        <Link
          href="/professional/storefront"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900"
        >
          <Store className="h-8 w-8 text-brand-600" />
          <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
            Edit Storefront
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Customize your public profile
          </p>
        </Link>

        <Link
          href="/professional/availability"
          className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-soft dark:border-slate-800 dark:bg-slate-900"
        >
          <Clock className="h-8 w-8 text-brand-600" />
          <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
            Set Availability
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Configure your working hours
          </p>
        </Link>
      </div>

      {/* Upcoming Bookings */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Upcoming Bookings
        </h2>

        {upcomingBookings && upcomingBookings.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-left font-medium text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-slate-500">
                    Time
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-slate-500">
                    Service
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right font-medium text-slate-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {upcomingBookings.map((booking: Record<string, unknown>) => {
                  const services = booking.services as { title: string } | null;
                  return (
                    <tr key={booking.id as string}>
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                        {new Date(
                          (booking.booking_date as string) + "T00:00:00"
                        ).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                        {(booking.start_time as string)?.substring(0, 5)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                        {services?.title ?? "N/A"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            booking.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}
                        >
                          {booking.status === "pending"
                            ? "Pending"
                            : "Confirmed"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-slate-900 dark:text-white">
                        R{Number(booking.total_amount).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <Calendar className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No upcoming bookings yet.
            </p>
          </div>
        )}
      </div>

      {/* Storefront Link */}
      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-800 dark:bg-brand-950">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-brand-900 dark:text-brand-100">
              Your Storefront Link
            </h3>
            <p className="mt-1 text-sm text-brand-700 dark:text-brand-300">
              Share this link with customers
            </p>
          </div>
          <code className="rounded-lg bg-white px-3 py-1.5 text-sm font-mono text-brand-700 dark:bg-slate-900 dark:text-brand-300">
            /pro/{pro.slug}
          </code>
        </div>
      </div>
    </div>
  );
}
