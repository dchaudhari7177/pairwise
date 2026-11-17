/**
 * Seeds (or resets) the demo scenario in Firestore.
 *
 *   FIREBASE_SERVICE_ACCOUNT=... npm run seed
 *   npm run seed -- --key .secrets/firebase-sa.json
 *
 * Safe to re-run: it deletes everything touching demo accounts, then writes a
 * fresh scenario with timestamps relative to now. Real sign-ups are untouched.
 */
import { readFileSync } from "node:fs";
import { seedDemo } from "../src/lib/seed";
import { FirestoreStore } from "../src/lib/store/firestore";

const keyArg = process.argv.indexOf("--key");
if (keyArg > -1) process.env.FIREBASE_SERVICE_ACCOUNT = readFileSync(process.argv[keyArg + 1], "utf8");
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT or pass --key <path-to-service-account.json>");
  process.exit(1);
}

const started = Date.now();
const result = await seedDemo(FirestoreStore.fromEnv(), Date.now(), { reset: true });
console.log(`Seeded ${result.users} users with ${result.writes} writes in ${((Date.now() - started) / 1000).toFixed(1)}s`);
process.exit(0);
