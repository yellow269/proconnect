import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your projects">
      <SearchParamsMessage searchParams={searchParams} />
      <AuthForm mode="login" />
      <div className="mt-5 flex justify-between text-sm">
        <Link href="/forgot-password" className="text-brand-600">
          Forgot password?
        </Link>
        <Link href="/register">Create account</Link>
      </div>
    </AuthShell>
  );
}

async function SearchParamsMessage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const message = params.message ?? params.error;
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
      {message}
    </div>
  );
}
