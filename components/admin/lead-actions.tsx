"use client";

import { Eye, Loader2, MessageCircle, Pencil, PhoneCall, UserPlus, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildWhatsAppLink, isTruthy, type Lead } from "@/lib/leads";

export type LeadMarkField = "contacted" | "replied" | "joined_proconnect";

interface LeadActionsProps {
  lead: Lead;
  busy?: boolean;
  compact?: boolean;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onMark: (lead: Lead, field: LeadMarkField) => void;
}

const buttonBase =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60";

const idleStyles =
  "border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white";

const doneStyles: Record<LeadMarkField, string> = {
  contacted:
    "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
  replied:
    "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  joined_proconnect:
    "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-950 dark:bg-brand-950 dark:text-brand-300",
};

export function LeadActions({ lead, busy, compact, onView, onEdit, onMark }: LeadActionsProps) {
  const waLink = buildWhatsAppLink(lead.phone);

  const markButtons: {
    field: LeadMarkField;
    icon: typeof PhoneCall;
    label: string;
    doneLabel: string;
  }[] = [
    {
      field: "contacted",
      icon: PhoneCall,
      label: "Mark contacted",
      doneLabel: "Marked as contacted",
    },
    {
      field: "replied",
      icon: Undo2,
      label: "Mark replied",
      doneLabel: "Marked as replied",
    },
    {
      field: "joined_proconnect",
      icon: UserPlus,
      label: "Mark joined ProConnect",
      doneLabel: "Marked as joined ProConnect",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        compact ? "justify-start" : "justify-end"
      )}
    >
      <button
        type="button"
        onClick={() => onView(lead)}
        disabled={busy}
        title="View lead"
        aria-label={`View ${lead.business_name ?? "lead"}`}
        className={cn(buttonBase, idleStyles)}
      >
        <Eye className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={() => onEdit(lead)}
        disabled={busy}
        title="Edit lead"
        aria-label={`Edit ${lead.business_name ?? "lead"}`}
        className={cn(buttonBase, idleStyles)}
      >
        <Pencil className="h-4 w-4" />
      </button>

      {markButtons.map(({ field, icon: Icon, label, doneLabel }) => {
        const done = isTruthy(lead[field]);
        return (
          <button
            key={field}
            type="button"
            onClick={() => onMark(lead, field)}
            disabled={busy}
            title={done ? doneLabel : label}
            aria-label={done ? doneLabel : label}
            aria-pressed={done}
            className={cn(buttonBase, done ? doneStyles[field] : idleStyles)}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}

      {busy ? (
        <span
          title="Saving"
          aria-label="Saving"
          className={cn(
            buttonBase,
            "border-slate-200 bg-white text-brand-600 dark:border-slate-700 dark:bg-slate-900"
          )}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      ) : waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          title="Open WhatsApp (opens a chat, nothing is sent automatically)"
          aria-label={`Open WhatsApp for ${lead.business_name ?? "lead"}`}
          className={cn(
            buttonBase,
            "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
          )}
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      ) : (
        <button
          type="button"
          disabled
          title="No phone number available"
          aria-label="No phone number available"
          className={cn(buttonBase, idleStyles)}
        >
          <MessageCircle className="h-4 w-4 opacity-40" />
        </button>
      )}
    </div>
  );
}
