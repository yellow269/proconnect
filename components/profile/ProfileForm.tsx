"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/types/database";

type Props = {
  user: {
    id: string;
    email?: string;
  };
  profile: Tables<"profiles"> | null;
  professionalProfile: Tables<"professional_profiles"> | null;
  role: string;
};

export default function ProfileForm({
  user,
  profile,
  professionalProfile,
  role,
}: Props) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [province, setProvince] = useState(profile?.province ?? "");
  const [businessName, setBusinessName] = useState(
    professionalProfile?.business_name ?? ""
  );
  const [bio, setBio] = useState(professionalProfile?.bio ?? "");
  const [website, setWebsite] = useState(professionalProfile?.website ?? "");

  const isProfessional = role === "professional";

  async function saveProfile() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validate
    if (!fullName.trim()) {
      setError("Full name is required.");
      setLoading(false);
      return;
    }

    if (isProfessional && !businessName.trim()) {
      setError("Business name is required for professionals.");
      setLoading(false);
      return;
    }

    // Save base profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
        province: province.trim() || null,
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // Save professional profile
    if (isProfessional) {
      const slug =
        professionalProfile?.slug ??
        businessName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      const { error: proError } = await supabase
        .from("professional_profiles")
        .upsert({
          user_id: user.id,
          business_name: businessName.trim(),
          slug,
          bio: bio.trim() || null,
          website: website.trim() || null,
        });

      if (proError) {
        setError(proError.message);
        setLoading(false);
        return;
      }
    }

    console.log("PROFILE SAVE SUCCESS", user.id);
    setLoading(false);

    if (isProfessional) {
      window.location.href = "/professional";
    }
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div>
        <label className="mb-2 block font-medium">Full Name</label>
        <input
          className="w-full rounded border p-3"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Phone</label>
        <input
          className="w-full rounded border p-3"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block font-medium">City</label>
          <input
            className="w-full rounded border p-3"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block font-medium">Province</label>
          <input
            className="w-full rounded border p-3"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
        </div>
      </div>

      {isProfessional && (
        <>
          <hr className="my-4" />
          <h3 className="text-lg font-semibold">Business Details</h3>

          <div>
            <label className="mb-2 block font-medium">Business Name</label>
            <input
              className="w-full rounded border p-3"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Bio</label>
            <textarea
              rows={4}
              className="w-full rounded border p-3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell customers about your services..."
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Website</label>
            <input
              className="w-full rounded border p-3"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.co.za"
            />
          </div>
        </>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Profile saved successfully!
          {isProfessional && " Redirecting..."}
        </div>
      )}

      <button
        onClick={saveProfile}
        disabled={loading}
        className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}
