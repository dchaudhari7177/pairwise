import { route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { assertAdmin } from "@/lib/services/moderation";
import { seedDemo } from "@/lib/seed";

export const POST = route(async () => {
  const { store, user } = await apiViewer();
  assertAdmin(user);
  return seedDemo(store, Date.now(), { reset: true });
});
