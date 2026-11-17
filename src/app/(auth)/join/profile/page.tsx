import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileWizard } from "@/components/forms/ProfileWizard";
import { requireMember } from "@/lib/server/viewer";
import { ageFrom } from "@/lib/time";

export const metadata: Metadata = { title: "Your profile" };

export default async function OnboardingPage() {
  const { user } = await requireMember({ allowIncomplete: true });
  if (user.onboarded) redirect("/today");
  const birthDate = user.profile?.birthDate ?? user.birthDate ?? "2000-01-01";
  return <ProfileWizard mode="onboarding" initial={{}} age={ageFrom(birthDate)} seed={user.id} />;
}
