import { route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { applyEvaluatorPass } from "@/lib/services/launch";

export const POST = route(async () => {
  const { store, user } = await apiViewer();
  return applyEvaluatorPass(store, user);
});
