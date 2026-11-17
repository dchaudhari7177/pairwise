import { profileSchema } from "@/lib/schemas";
import { body, route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { saveProfile } from "@/lib/services/users";
import type { ProfileInput } from "@/lib/services/users";

export const PUT = route(async (req) => {
  const { store, user } = await apiViewer();
  const input = (await body(req, profileSchema)) as ProfileInput;
  await saveProfile(store, user, input);
  return { ok: true };
});
