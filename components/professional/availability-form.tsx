"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface Availability {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function AvailabilityForm() {
  const supabase = createClient();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New entry state
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("availability")
        .select("*")
        .eq("professional_id", user.id)
        .order("weekday")
        .order("start_time");

      setAvailability(data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function addEntry() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (newStart >= newEnd) {
      alert("End time must be after start time");
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from("availability")
      .insert({
        professional_id: user.id,
        weekday: newDay,
        start_time: newStart,
        end_time: newEnd,
      })
      .select()
      .single();

    if (!error && data) {
      setAvailability((prev) => [...prev, data].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)));
    }
    setSaving(false);
  }

  async function removeEntry(id: string) {
    await supabase.from("availability").delete().eq("id", id);
    setAvailability((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-slate-500">
        Loading availability...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Schedule */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Current Schedule
        </h3>
        {availability.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No availability set. Add your working hours below.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {availability.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {DAYS[entry.weekday]}
                  </span>
                  <span className="text-sm text-slate-500">
                    {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                  </span>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Entry */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Add Working Hours
        </h3>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Day</label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            >
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>
                  {DAYS[d]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Start</label>
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">End</label>
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>
        <button
          onClick={addEntry}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {saving ? "Adding..." : "Add Hours"}
        </button>
      </div>
    </div>
  );
}
