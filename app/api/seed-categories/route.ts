import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });

  if (count && count > 0) {
    return NextResponse.json({ seeded: false, count });
  }

  const { error } = await supabase.rpc("seed_categories");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { count: after } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({ seeded: true, count: after });
}
