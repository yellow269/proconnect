"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserRole } from "@/types/database";
import { emailSchema, loginSchema, registerSchema, resetSchema } from "@/lib/validation/auth";

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" | "reset" }) {
  const router = useRouter(); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(formData: FormData) { setLoading(true); setError(""); const email=String(formData.get("email")??""); const password=String(formData.get("password")??""); const confirmPassword=String(formData.get("confirmPassword")??""); const fullName=String(formData.get("fullName")??""); const role=String(formData.get("role")??"customer"); const parsed = mode==="login" ? loginSchema.safeParse({email,password}) : mode==="register" ? registerSchema.safeParse({email,password,confirmPassword,fullName,role}) : mode==="forgot" ? emailSchema.safeParse({email}) : resetSchema.safeParse({password,confirmPassword}); if(!parsed.success){setError(parsed.error.issues[0]?.message??"Check your details");setLoading(false);return;} const supabase=createClient(); let result: { error: { message: string } | null };
    if(mode==="login") result=await supabase.auth.signInWithPassword({email,password});
    else if(mode==="register") result=await supabase.auth.signUp({email,password,options:{emailRedirectTo:`${location.origin}/auth/callback`,data:{full_name:fullName,role:role as UserRole}}});
    else if(mode==="forgot") result=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/reset-password`});
    else result=await supabase.auth.updateUser({password});
    if(result.error){setError(result.error.message);setLoading(false);return;} router.push(mode==="forgot"||mode==="register"?"/login?message=Check your email":"/dashboard"); router.refresh(); }
  async function google(){const supabase=createClient();await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${location.origin}/auth/callback`}});}
  return <form action={submit} className="space-y-4">{mode==="register"&&<><Input name="fullName" placeholder="Full name" required minLength={2}/><select name="role" className="h-11 w-full rounded-xl border bg-transparent px-3 text-sm dark:border-slate-700"><option value="customer">I need work done</option><option value="professional">I offer services</option></select></>}{mode!=="reset"&&<Input name="email" type="email" placeholder="Email address" required autoComplete="email"/>}{mode!=="forgot"&&<Input name="password" type="password" placeholder="Password (8+ characters)" minLength={8} maxLength={72} required autoComplete={mode==="login"?"current-password":"new-password"}/>} {(mode==="register"||mode==="reset")&&<Input name="confirmPassword" type="password" placeholder="Confirm password" minLength={8} maxLength={72} required autoComplete="new-password"/>}{error&&<p role="alert" className="text-sm text-red-600">{error}</p>}<Button className="w-full" disabled={loading}>{loading?"Please wait…":({login:"Log in",register:"Create account",forgot:"Send reset link",reset:"Update password"}[mode])}</Button>{(mode==="login"||mode==="register")&&<><div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/>OR<span className="h-px flex-1 bg-slate-200 dark:bg-slate-700"/></div><Button type="button" variant="secondary" className="w-full" onClick={google}>Continue with Google</Button></>}</form>;
}
