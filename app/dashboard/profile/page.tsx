import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Only fetch professional profile if user is a professional
  let professionalProfile = null;
  if (profile?.role === "professional") {
    const { data } = await supabase
      .from("professional_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    professionalProfile = data;
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">
        {profile?.role === "professional" ? "Professional Profile" : "Your Profile"}
      </h1>

      <ProfileForm
        user={user}
        profile={profile}
        professionalProfile={professionalProfile}
        role={profile?.role ?? "customer"}
      />
    </main>
  );
}
