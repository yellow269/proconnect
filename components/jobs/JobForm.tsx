"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect } from "@/components/ui/searchable-select";

type Category = {
  id: string;
  name: string;
};

export default function JobForm({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  useEffect(() => {
    async function loadCategories() {
      let { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (!data || data.length === 0) {
        await supabase.rpc("seed_categories");
        const result = await supabase
          .from("categories")
          .select("id, name")
          .order("name");
        data = result.data;
      }

      if (data) setCategories(data);
    }
    loadCategories();
    // supabase is memoized with useMemo — stable reference, safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate(): string | null {
    const t = title.trim();
    if (t.length < 5) return "Title must be at least 5 characters.";
    if (t.length > 160) return "Title must be under 160 characters.";
    if (!categoryId) return "Please select a category.";
    const d = description.trim();
    if (d.length < 20) return "Description must be at least 20 characters.";
    if (d.length > 5000) return "Description must be under 5000 characters.";
    const c = city.trim();
    if (!c) return "Please enter a city.";
    const p = province.trim();
    if (!p) return "Please enter a province.";
    if (budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax)) {
      return "Minimum budget cannot exceed maximum budget.";
    }
    return null;
  }

  async function publishJob() {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const { error: insertError } = await supabase.from("jobs").insert([
      {
        customer_id: userId,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        city: city.trim(),
        province: province.trim(),
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        status: "open",
        published_at: new Date().toISOString(),
      },
    ]);

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/dashboard/my-jobs");
  }

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6 shadow">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="mb-2 block font-medium">Job Title</label>
        <input
          className="w-full rounded border p-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Kitchen renovation needed"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Category</label>
        <SearchableSelect
          options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Select a category..."
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Description</label>
        <textarea
          rows={6}
          className="w-full rounded border p-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the work you need done, including any requirements, timeline, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block font-medium">Minimum Budget (ZAR)</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 5000"
            className="rounded border p-3"
            value={budgetMin}
            onChange={(e) => setBudgetMin(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Maximum Budget (ZAR)</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 15000"
            className="rounded border p-3"
            value={budgetMax}
            onChange={(e) => setBudgetMax(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block font-medium">City</label>
          <input
            placeholder="e.g. Cape Town"
            className="rounded border p-3"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Province</label>
          <input
            placeholder="e.g. Western Cape"
            className="rounded border p-3"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
        </div>
      </div>

      <button
        onClick={publishJob}
        disabled={loading || !categoryId}
        className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Publishing..." : "Publish Job"}
      </button>
    </div>
  );
}
