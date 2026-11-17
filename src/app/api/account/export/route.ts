import { route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { exportData } from "@/lib/services/account";

export const GET = route(async () => {
  const { store, user } = await apiViewer();
  const data = await exportData(store, user);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="pairwise-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
});
