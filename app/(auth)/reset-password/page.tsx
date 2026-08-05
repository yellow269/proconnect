import { AuthForm } from "@/components/auth/auth-form"; import { AuthShell } from "@/components/auth/auth-shell";
export default function Page(){return <AuthShell title="Choose a new password" subtitle="Use at least eight characters"><AuthForm mode="reset"/></AuthShell>}
