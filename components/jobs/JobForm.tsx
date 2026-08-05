"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
};

export default function JobForm({ userId }: { userId: string }) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

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
  }, [supabase]);

  async function publishJob() {
    setLoading(true);

    const { error } = await supabase.from("jobs").insert([
      {
        customer_id: userId,
        category_id: categoryId,
        title,
        description,
        city,
        province,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        status: "draft",
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Job created successfully!");

    setTitle("");
    setCategoryId("");
    setDescription("");
    setBudgetMin("");
    setBudgetMax("");
    setCity("");
    setProvince("");
  }

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6 shadow">
      <div>
        <label className="mb-2 block font-medium">Job Title</label>
        <input
          className="w-full rounded border p-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Category</label>
        <select
          className="w-full rounded border p-3"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">Description</label>
        <textarea
          rows={6}
          className="w-full rounded border p-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Minimum Budget"
          className="rounded border p-3"
          value={budgetMin}
          onChange={(e) => setBudgetMin(e.target.value)}
        />

        <input
          type="number"
          placeholder="Maximum Budget"
          className="rounded border p-3"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <input
          placeholder="City"
          className="rounded border p-3"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <input
          placeholder="Province"
          className="rounded border p-3"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        />
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
