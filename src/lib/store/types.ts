// A deliberately small document-store interface. The app talks only to this,
// so the same services run against Firestore in production and an in-memory
// store in tests and local development.

export type Op = "==" | "!=" | "<" | "<=" | ">" | ">=" | "array-contains" | "in";
export type Filter = [field: string, op: Op, value: unknown];

export const INC = Symbol.for("pairwise.inc");
export const DELETE = Symbol.for("pairwise.delete");

export interface IncrementOp {
  [INC]: number;
}
export interface DeleteOp {
  [DELETE]: true;
}

/** Atomically add `n` to a numeric field (works with dotted paths). */
export const inc = (n: number): IncrementOp => ({ [INC]: n });
/** Remove a field. */
export const del = (): DeleteOp => ({ [DELETE]: true });

export type Patch = Record<string, unknown>;

export type WriteOp =
  | { type: "set"; col: string; id: string; data: object }
  | { type: "update"; col: string; id: string; patch: Patch }
  | { type: "delete"; col: string; id: string };

export interface DocStore {
  readonly kind: "memory" | "firestore";
  get<T>(col: string, id: string): Promise<T | null>;
  getMany<T>(col: string, ids: string[]): Promise<(T | null)[]>;
  set(col: string, id: string, data: object): Promise<void>;
  /** Shallow-merge `patch`. Keys may be dotted paths such as `unread.uid`. */
  update(col: string, id: string, patch: Patch): Promise<void>;
  remove(col: string, id: string): Promise<void>;
  query<T>(col: string, filters?: Filter[], limit?: number): Promise<T[]>;
  /** Apply writes together (a Firestore batch: all or nothing). */
  batch(ops: WriteOp[]): Promise<void>;
}

export function isInc(v: unknown): v is IncrementOp {
  return typeof v === "object" && v !== null && INC in v;
}
export function isDel(v: unknown): v is DeleteOp {
  return typeof v === "object" && v !== null && DELETE in v;
}
