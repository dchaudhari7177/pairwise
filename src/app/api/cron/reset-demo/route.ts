import { forbidden } from "@/lib/errors";
import { route } from "@/lib/server/api";
import { seedDemo } from "@/lib/seed";
import { getStore } from "@/lib/store";

// Vercel Cron calls this nightly (see vercel.json) with `Authorization: Bearer $CRON_SECRET`,
// so the demo scenario never goes stale for evaluators.
export const GET = route(async (req) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) throw forbidden();
  return seedDemo(await getStore(), Date.now(), { reset: true });
});

// Resetting the demo touches a few hundred documents; give it headroom.
export const maxDuration = 60;
