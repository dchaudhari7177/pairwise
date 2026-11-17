import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { fileReport } from "@/lib/services/moderation";

const schema = z.object({
  reported: z.string().min(1).max(80),
  matchId: z.string().max(200).optional(),
  category: z.enum(["fake_profile", "scam_or_money", "harassment", "inappropriate_content", "underage", "offline_behaviour", "other"]),
  details: z.string().max(1000).optional(),
});

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  return fileReport(store, user, await body(req, schema));
});
