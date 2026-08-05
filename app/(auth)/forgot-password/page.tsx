import { AuthForm } from "@/components/auth/auth-form"; import { AuthShell } from "@/components/auth/auth-shell";
export default function Page(){return <AuthShell title="Reset your password" subtitle="We’ll email you a secure reset link"><AuthForm mode="forgot"/></AuthShell>}
