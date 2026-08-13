import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: professionalId } = await params;

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("customer_id", user.id)
    .eq("professional_id", professionalId);

  if (error) {
    console.error("[Favorites] Delete error:", error.message);
    return NextResponse.json({ error: "Failed to remove favorite" }, { status: 500 });
  }

  return NextResponse.json({ favorited: false });
}
