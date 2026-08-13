"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";

export function FavoriteButton({
  professionalId,
  initialFavorited = false,
  size = "sm",
}: {
  professionalId: string;
  initialFavorited?: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  // Sync with initialFavorited when it changes
  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      if (favorited) {
        const res = await fetch(`/api/favorites/${professionalId}`, {
          method: "DELETE",
        });
        if (res.ok) setFavorited(false);
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ professional_id: professionalId }),
        });
        if (res.ok) setFavorited(true);
      }
    } finally {
      setLoading(false);
    }
  }

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-50 ${
        favorited
          ? "text-red-500 hover:text-red-600"
          : "text-slate-400 hover:text-red-400"
      }`}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className={`${iconSize} ${favorited ? "fill-current" : ""}`} />
      {size === "md" && (
        <span>{favorited ? "Saved" : "Save"}</span>
      )}
    </button>
  );
}
