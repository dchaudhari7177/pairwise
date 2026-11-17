import type { Metadata } from "next";
import { ProfileWizard } from "@/components/forms/ProfileWizard";
import type { ProfileForm } from "@/lib/schemas";
import { requireMember } from "@/lib/server/viewer";
import { toCard } from "@/lib/services/profiles";
import { ageFrom } from "@/lib/time";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const { user } = await requireMember();
  const p = user.profile!;
  const { birthDate: _b, avatarSeed: _s, photoId: _ph, ...rest } = p;
  const card = toCard(user, { self: true });
  return (
    <div className="flex justify-center">
      <ProfileWizard
        mode="edit"
        initial={{ ...(rest as Partial<ProfileForm>), photo: card.photo, blurPhotos: user.privacy.blurPhotos }}
        age={ageFrom(p.birthDate)}
        seed={p.avatarSeed}
      />
    </div>
  );
}
