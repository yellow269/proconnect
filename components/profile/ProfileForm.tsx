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

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        phone: phone || null,
        city: city || null,
        province: province || null,
      });

    if (profileError) {
      alert(profileError.message);
      setLoading(false);
      return;
    }

    // Only save professional profile if user is a professional
    if (isProfessional && (professionalProfile || businessName)) {
      const slug =
        professionalProfile?.slug ??
        businessName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      const { error: proError } = await supabase
        .from("professional_profiles")
        .upsert({
          user_id: user.id,
          business_name: businessName || "My Business",
          slug,
          bio: bio || null,
          website: website || null,
        });

      if (proError) {
        alert(proError.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    alert("Profile saved successfully!");
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
