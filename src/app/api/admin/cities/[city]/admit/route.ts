import { route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { notFound } from "@/lib/errors";
import { admitNextBatch } from "@/lib/services/launch";
import { assertAdmin } from "@/lib/services/moderation";
import { CITIES } from "@/lib/options";
import type { CityId } from "@/lib/types";

export const POST = route<{ city: string }>(async (_req, { city }) => {
  const { store, user } = await apiViewer();
  assertAdmin(user);
  if (!(city in CITIES)) throw notFound("Unknown city.");
  return admitNextBatch(store, city as CityId);
});
