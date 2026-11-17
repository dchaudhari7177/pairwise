import { route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { cancel } from "@/lib/services/plus";

export const POST = route(async () => {
  const { store, user } = await apiViewer();
  await cancel(store, user);
  return { ok: true };
});
