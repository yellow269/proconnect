import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { siteConfig } from "@/lib/config";
export function AuthShell({title,subtitle,children}: {title:string;subtitle:string;children:React.ReactNode}) { return <main className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-slate-950"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900"><Link href="/" className="mb-8 flex items-center justify-center gap-2 font-bold"><BriefcaseBusiness className="h-7 w-7 text-brand-600"/>{siteConfig.name}</Link><h1 className="text-center text-2xl font-bold">{title}</h1><p className="mb-7 mt-2 text-center text-sm text-slate-500">{subtitle}</p>{children}</div></main>; }
