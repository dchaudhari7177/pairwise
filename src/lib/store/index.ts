import "server-only";
import { join } from "node:path";
import { MemoryStore } from "./memory";
import type { DocStore } from "./types";

export * from "./types";

type Holder = { store?: DocStore; ready?: Promise<DocStore> };
const holder = globalThis as typeof globalThis & { __pairwise?: Holder };
const state: Holder = (holder.__pairwise ??= {});

/**
 * Returns the process-wide store.
 *
 * - `FIREBASE_SERVICE_ACCOUNT` set → Firestore (production).
 * - otherwise → in-memory store persisted to `.data/db.json`, seeded with the
 *   demo scenario on first use, so `npm run dev` works with zero setup.
 */
export function getStore(): Promise<DocStore> {
  if (state.ready) return state.ready;
  state.ready = (async () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const { FirestoreStore } = await import("./firestore");
      state.store = FirestoreStore.fromEnv();
      return state.store;
    }
    const file = process.env.VERCEL ? undefined : join(process.cwd(), ".data", "db.json");
    const memory = new MemoryStore(file);
    state.store = memory;
    if (memory.isEmpty()) {
      const { seedDemo } = await import("../seed");
      await seedDemo(memory);
    }
    return memory;
  })();
  state.ready.catch(() => {
    state.ready = undefined;
  });
  return state.ready;
}

/** Test hook: swap in a fresh store. */
export function setStoreForTests(store: DocStore) {
  state.store = store;
  state.ready = Promise.resolve(store);
}
