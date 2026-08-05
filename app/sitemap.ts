import type { MetadataRoute } from "next"; import { siteConfig } from "@/lib/config";
export default function sitemap():MetadataRoute.Sitemap{return ["","/login","/register"].map((path)=>({url:`${siteConfig.url}${path}`,lastModified:new Date(),changeFrequency:path===""?"weekly":"monthly",priority:path===""?1:.5}))}
