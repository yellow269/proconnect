"use client";

import { useState } from "react";
import { Link2, MessageCircle, Share2, Check } from "lucide-react";

interface ShareBarProps {
  slug: string;
  businessName: string;
}

export function ShareBar({ slug, businessName }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/pro/${slug}`
      : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shareWhatsApp() {
    const message = encodeURIComponent(
      `Check out ${businessName} on ProConnect: ${url}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank"
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={copyLink}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" />
            Copy Link
          </>
        )}
      </button>

      <button
        onClick={shareWhatsApp}
        className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </button>

      <button
        onClick={shareFacebook}
        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <Share2 className="h-4 w-4" />
        Facebook
      </button>
    </div>
  );
}
