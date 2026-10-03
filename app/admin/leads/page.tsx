"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LEAD_FILTERS,
  sanitizeSearchTerm,
  isTruthy,
  type Lead,
  type LeadFilter,
  type LeadUpdate,
} from "@/lib/leads";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LeadActions, type LeadMarkField } from "@/components/admin/lead-actions";
import { LeadModal } from "@/components/admin/lead-modal";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";

const PAGE_SIZE = 25;

const STATUS_ACTIVE: Record<LeadMarkField, string> = {
  contacted:
    "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  replied: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  joined_proconnect:
    "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300",
};

const STATUS_INACTIVE =
  "border border-dashed border-slate-200 text-slate-400 dark:border-slate-700 dark:text-slate-500";

const MARK_MESSAGES: Record<LeadMarkField, string> = {
  contacted: "Marked as contacted",
  replied: "Marked as replied",
  joined_proconnect: "Marked as joined ProConnect",
};

interface LeadStats {
  total: number;
  newLeads: number;
  replied: number;
  joined: number;
}

type CountBuilder = PromiseLike<{
  count: number | null;
  error: { message: string } | null;
}>;

async function runCount(builder: CountBuilder): Promise<number> {
  const { count, error } = await builder;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function buildPattern(term: string): string {
  return `%${term.replace(/[%_]/g, (char) => `\\${char}`)}%`;
}

function StatusPills({ lead }: { lead: Lead }) {
  const hasFlag =
    isTruthy(lead.contacted) ||
    isTruthy(lead.replied) ||
    isTruthy(lead.joined_proconnect);

  if (!hasFlag) {
    return (
      <span
        className={cn(
          "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        )}
      >
        New
      </span>
    );
  }

  const pills: { field: LeadMarkField; label: string }[] = [
    { field: "contacted", label: "Contacted" },
    { field: "replied", label: "Replied" },
    { field: "joined_proconnect", label: "Joined" },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {pills.map(({ field, label }) => (
        <span
          key={field}
          className={cn(
            "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
            isTruthy(lead[field]) ? STATUS_ACTIVE[field] : STATUS_INACTIVE
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-6">
      <p className="mb-3 text-sm text-slate-500">Loading leads...</p>
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminLeadsPage() {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const getSupabase = useCallback(() => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    return supabaseRef.current;
  }, []);

  const requestIdRef = useRef(0);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    newLeads: 0,
    replied: 0,
    joined: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LeadFilter>("all");
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState<{ lead: Lead; mode: "view" | "edit" } | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(
    null
  );

  const loadList = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      let builder = supabase.from("leads").select("*", { count: "exact" });

      if (filter === "new") {
        builder = builder.or("contacted.eq.false,contacted.is.null");
      } else if (filter === "contacted") {
        builder = builder.eq("contacted", true);
      } else if (filter === "replied") {
        builder = builder.eq("replied", true);
      } else if (filter === "joined") {
        builder = builder.eq("joined_proconnect", true);
      }

      const term = sanitizeSearchTerm(query);
      if (term) {
        const pattern = buildPattern(term);
        builder = builder.or(
          `business_name.ilike.${pattern},phone.ilike.${pattern},service.ilike.${pattern},city.ilike.${pattern}`
        );
      }

      const from = page * PAGE_SIZE;
      const {
        data,
        error: listError,
        count: total,
      } = await builder
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (listError) throw new Error(listError.message);
      if (requestId !== requestIdRef.current) return;

      setLeads((data ?? []) as Lead[]);
      setCount(total ?? 0);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setLeads([]);
      setCount(0);
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [filter, page, query, getSupabase]);

  const loadStats = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const [total, newLeads, replied, joined] = await Promise.all([
        runCount(supabase.from("leads").select("id", { head: true, count: "exact" })),
        runCount(
          supabase
            .from("leads")
            .select("id", { head: true, count: "exact" })
            .or("contacted.eq.false,contacted.is.null")
        ),
        runCount(
          supabase
            .from("leads")
            .select("id", { head: true, count: "exact" })
            .eq("replied", true)
        ),
        runCount(
          supabase
            .from("leads")
            .select("id", { head: true, count: "exact" })
            .eq("joined_proconnect", true)
        ),
      ]);

      setStats({ total, newLeads, replied, joined });
    } catch {
      // Summary cards are decorative - the list surfaces real errors.
    }
  }, [getSupabase]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages - 1) setPage(totalPages - 1);
  }, [page, totalPages]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function persist(lead: Lead, patch: LeadUpdate) {
    const supabase = getSupabase();
    const payload = { ...patch, updated_at: new Date().toISOString() };

    const { data, error: updateError } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", lead.id)
      .select();

    if (updateError) throw new Error(updateError.message);

    const updated =
      Array.isArray(data) && data.length > 0
        ? (data[0] as Lead)
        : Object.assign({ ...lead }, payload);

    setLeads((prev) => prev.map((item) => (item.id === lead.id ? updated : item)));
    setModal((prev) =>
      prev && prev.lead.id === lead.id ? { ...prev, lead: updated } : prev
    );
  }

  function refresh() {
    void loadList();
    void loadStats();
  }

  async function handleSave(patch: LeadUpdate) {
    if (!modal || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await persist(modal.lead, patch);
      setModal(null);
      setToast({ tone: "success", message: "Lead updated" });
      void loadStats();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleMark(lead: Lead, field: LeadMarkField) {
    if (pendingId) return;
    setPendingId(lead.id);
    try {
      const patch: LeadUpdate =
        field === "contacted"
          ? { contacted: true }
          : field === "replied"
            ? { replied: true }
            : { joined_proconnect: true };
      await persist(lead, patch);
      setToast({ tone: "success", message: MARK_MESSAGES[field] });
      void loadStats();
    } catch (e) {
      setToast({
        tone: "error",
        message: e instanceof Error ? e.message : "Failed to update lead",
      });
    } finally {
      setPendingId(null);
    }
  }

  const hasActiveQuery = Boolean(query) || filter !== "all";

  function clearFilters() {
    setSearch("");
    setQuery("");
    setFilter("all");
    setPage(0);
  }

  const rangeStart = count === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(count, (page + 1) * PAGE_SIZE);

  const summaryCards: {
    value: LeadFilter;
    label: string;
    count: number;
    icon: typeof Users;
    iconClass: string;
  }[] = [
    {
      value: "all",
      label: "Total Leads",
      count: stats.total,
      icon: Users,
      iconClass:
        "bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300",
    },
    {
      value: "new",
      label: "New Leads",
      count: stats.newLeads,
      icon: CircleDot,
      iconClass:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
    {
      value: "replied",
      label: "Replied",
      count: stats.replied,
      icon: MessageSquare,
      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
    },
    {
      value: "joined",
      label: "Joined ProConnect",
      count: stats.joined,
      icon: BadgeCheck,
      iconClass:
        "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300",
    },
  ];

  let content: React.ReactNode;
  if (loading && leads.length === 0) {
    content = <ListSkeleton />;
  } else if (leads.length === 0) {
    content = error ? (
      <div
        role="alert"
        className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-slate-900"
      >
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-3 font-semibold text-slate-900 dark:text-white">
          Could not load leads
        </p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <button
          type="button"
          onClick={refresh}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    ) : (
      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <Search className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 font-semibold text-slate-900 dark:text-white">
          {hasActiveQuery ? "No leads match your search" : "No leads yet"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {hasActiveQuery
            ? "Try a different search term or clear the active filters."
            : "Leads captured for ProConnect will appear here."}
        </p>
        {hasActiveQuery && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Clear search & filters
          </button>
        )}
      </div>
    );
  } else {
    content = (
      <>
        <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block">
          <table className="w-full min-w-[58rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Business
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Service
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  City
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Phone
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Notes
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="align-top transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {lead.business_name || "—"}
                    </p>
                    {lead.contact_name && (
                      <p className="text-xs text-slate-500">
                        {lead.contact_name}
                      </p>
                    )}
                    {lead.address && (
                      <p className="mt-1 flex items-start gap-1 text-xs text-slate-400">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-2">{lead.address}</span>
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {lead.service || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {lead.city || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                    {lead.phone ? (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {lead.phone}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPills lead={lead} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="line-clamp-3 max-w-[12rem] text-xs text-slate-500">
                      {lead.notes || "—"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <LeadActions
                      lead={lead}
                      busy={pendingId === lead.id}
                      onView={(item) => setModal({ lead: item, mode: "view" })}
                      onEdit={(item) => setModal({ lead: item, mode: "edit" })}
                      onMark={handleMark}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-3 md:hidden">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900 dark:text-white">
                    {lead.business_name || "—"}
                  </h3>
                  {lead.contact_name && (
                    <p className="truncate text-xs text-slate-500">
                      {lead.contact_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <StatusPills lead={lead} />
              </div>

              <dl className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Service
                  </dt>
                  <dd className="min-w-0 flex-1">{lead.service || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                    City
                  </dt>
                  <dd className="min-w-0 flex-1">{lead.city || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Phone
                  </dt>
                  <dd className="min-w-0 flex-1 break-words">{lead.phone || "—"}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-20 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Address
                  </dt>
                  <dd className="min-w-0 flex-1 break-words">{lead.address || "—"}</dd>
                </div>
              </dl>

              <div className="mt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
                  {lead.notes || "—"}
                </p>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                <LeadActions
                  lead={lead}
                  busy={pendingId === lead.id}
                  compact
                  onView={(item) => setModal({ lead: item, mode: "view" })}
                  onEdit={(item) => setModal({ lead: item, mode: "edit" })}
                  onMark={handleMark}
                />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-slate-500">
            Showing {rangeStart}–{rangeEnd} of {count} lead
            {count === 1 ? "" : "s"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0 || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-slate-500">
              Page {Math.min(page + 1, totalPages)} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Leads
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Search, qualify and update your ProConnect lead pipeline.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </button>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <button
            key={card.value}
            type="button"
            onClick={() => {
              setFilter(card.value);
              setPage(0);
            }}
            aria-pressed={filter === card.value}
            className={cn(
              "rounded-2xl border bg-white p-4 text-left transition dark:bg-slate-900",
              filter === card.value
                ? "border-brand-400 ring-2 ring-brand-500/20 dark:border-brand-700"
                : "border-slate-200 hover:border-brand-200 dark:border-slate-800"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {card.label}
              </span>
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  card.iconClass
                )}
              >
                <card.icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {card.count}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search business name, phone, service or city"
            aria-label="Search leads"
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          {LEAD_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setFilter(option.value);
                setPage(0);
              }}
              aria-pressed={filter === option.value}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition",
                filter === option.value
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {error && leads.length > 0 && (
        <div
          role="alert"
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={refresh}
            className="font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {content}

      {modal && (
        <LeadModal
          key={`${modal.lead.id}-${modal.mode}`}
          lead={modal.lead}
          mode={modal.mode}
          saving={saving}
          error={saveError}
          onClose={() => {
            setModal(null);
            setSaveError(null);
          }}
          onRequestEdit={() =>
            setModal((prev) => (prev ? { ...prev, mode: "edit" } : prev))
          }
          onSave={(patch) => void handleSave(patch)}
        />
      )}

      {toast && (
        <div
          role="status"
          className={cn(
            "fixed bottom-4 right-4 z-50 flex max-w-xs items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
            toast.tone === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          )}
        >
          {toast.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="rounded p-1 opacity-80 transition hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
