import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { FieldValue, getFirestore, type Firestore, type WhereFilterOp } from "firebase-admin/firestore";
import { DELETE, INC, isDel, isInc, type DocStore, type Filter, type Patch, type WriteOp } from "./types";

function toFirestore(patch: Patch): Patch {
  const out: Patch = {};
  for (const [key, value] of Object.entries(patch)) {
    if (isInc(value)) out[key] = FieldValue.increment((value as unknown as Record<symbol, number>)[INC]);
    else if (isDel(value)) out[key] = FieldValue.delete();
    else out[key] = value;
  }
  return out;
}

// Firestore rejects `in` queries with more than 30 values.
const IN_LIMIT = 30;

export class FirestoreStore implements DocStore {
  readonly kind = "firestore" as const;

  constructor(private readonly db: Firestore) {}

  static fromEnv(): FirestoreStore {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not set");
    const json = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const account = JSON.parse(json) as ServiceAccount & { project_id?: string };
    const app =
      getApps().find((a) => a.name === "pairwise") ??
      initializeApp({ credential: cert(account), projectId: account.project_id }, "pairwise");
    const db = getFirestore(app);
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings() may only be called once per instance; a hot reload re-enters here.
    }
    return new FirestoreStore(db);
  }

  async get<T>(col: string, id: string): Promise<T | null> {
    const snap = await this.db.collection(col).doc(id).get();
    return snap.exists ? (snap.data() as T) : null;
  }

  async getMany<T>(col: string, ids: string[]): Promise<(T | null)[]> {
    if (ids.length === 0) return [];
    const refs = ids.map((id) => this.db.collection(col).doc(id));
    const snaps = await this.db.getAll(...refs);
    return snaps.map((s) => (s.exists ? (s.data() as T) : null));
  }

  async set(col: string, id: string, data: object): Promise<void> {
    await this.db.collection(col).doc(id).set(data);
  }

  async update(col: string, id: string, patch: Patch): Promise<void> {
    await this.db.collection(col).doc(id).update(toFirestore(patch));
  }

  async remove(col: string, id: string): Promise<void> {
    await this.db.collection(col).doc(id).delete();
  }

  async query<T>(col: string, filters: Filter[] = [], limit?: number): Promise<T[]> {
    const inFilter = filters.find(([, op, v]) => op === "in" && Array.isArray(v) && v.length > IN_LIMIT);
    if (inFilter) {
      // Split oversized `in` queries into chunks and merge the results.
      const values = inFilter[2] as unknown[];
      const rest = filters.filter((f) => f !== inFilter);
      const chunks: T[][] = [];
      for (let i = 0; i < values.length; i += IN_LIMIT) {
        chunks.push(await this.query<T>(col, [...rest, [inFilter[0], "in", values.slice(i, i + IN_LIMIT)]]));
      }
      const merged = chunks.flat();
      return limit ? merged.slice(0, limit) : merged;
    }
    let q: FirebaseFirestore.Query = this.db.collection(col);
    for (const [field, op, value] of filters) {
      if (op === "in" && Array.isArray(value) && value.length === 0) return [];
      q = q.where(field, op as WhereFilterOp, value);
    }
    if (limit) q = q.limit(limit);
    const snap = await q.get();
    return snap.docs.map((d) => d.data() as T);
  }

  async batch(ops: WriteOp[]): Promise<void> {
    // Firestore batches cap at 500 writes; chunk larger ones (seeding only).
    for (let i = 0; i < ops.length; i += 450) {
      const batch = this.db.batch();
      for (const op of ops.slice(i, i + 450)) {
        const ref = this.db.collection(op.col).doc(op.id);
        if (op.type === "set") batch.set(ref, op.data);
        else if (op.type === "update") batch.update(ref, toFirestore(op.patch));
        else batch.delete(ref);
      }
      await batch.commit();
    }
  }
}

export { DELETE, INC };
