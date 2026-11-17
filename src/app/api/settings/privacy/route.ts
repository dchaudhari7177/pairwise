import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { updatePrivacy } from "@/lib/services/users";

const schema = z.object({
  hideFromCompany: z.boolean().optional(),
  hideFromCollege: z.boolean().optional(),
  blurPhotos: z.boolean().optional(),
});

export const PATCH = route(async (req) => {
  const { store, user } = await apiViewer();
  return { ok: true, privacy: await updatePrivacy(store, user, await body(req, schema)) };
});
