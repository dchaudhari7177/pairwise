import { forbidden } from "@/lib/errors";
import { demoAccountFor } from "@/lib/demo-guide";
import { rateLimit } from "@/lib/rate-limit";
import { route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { seedDemo } from "@/lib/seed";

// Several evaluators may share the demo accounts on the same day, so one of them
// may find Ishita's date already accepted. Any demo account can restore every
// story without waiting for the nightly reset. It is rate-limited globally,
// because a reset rewrites the whole demo for everyone.
export const POST = route(async () => {
  const { store, user } = await apiViewer();
  if (!demoAccountFor(user.email)) throw forbidden("Only demo accounts can reset the demo.");
  await rateLimit(store, "demo-reset", 3, 10 * 60 * 1000);
  return seedDemo(store, Date.now(), { reset: true });
});

// Resetting the demo touches a few hundred documents; give it headroom.
export const maxDuration = 60;
