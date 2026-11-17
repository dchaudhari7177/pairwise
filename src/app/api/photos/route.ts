import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { removePhoto, uploadPhoto } from "@/lib/services/photos";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { full, blur } = await body(req, z.object({ full: z.string(), blur: z.string() }));
  return { ok: true, id: await uploadPhoto(store, user, full, blur) };
});

export const DELETE = route(async () => {
  const { store, user } = await apiViewer();
  await removePhoto(store, user);
  return { ok: true };
});
