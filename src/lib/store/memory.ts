import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { INC, isDel, isInc, type DocStore, type Filter, type Patch, type WriteOp } from "./types";

type Doc = Record<string, unknown>;
type Data = Record<string, Record<string, Doc>>;

function getPath(obj: Doc, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Doc)[key];
    return undefined;
  }, obj);
}

function applyPatch(target: Doc, patch: Patch) {
  for (const [path, value] of Object.entries(patch)) {
    const keys = path.split(".");
    let node: Doc = target;
    for (const key of keys.slice(0, -1)) {
      if (typeof node[key] !== "object" || node[key] === null) node[key] = {};
      node = node[key] as Doc;
    }
    const last = keys[keys.length - 1];
    if (isDel(value)) delete node[last];
    else if (isInc(value)) node[last] = (Number(node[last]) || 0) + (value as unknown as Record<symbol, number>)[INC];
    else if (value !== undefined) node[last] = structuredClone(value);
  }
}

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function matches(doc: Doc, [field, op, value]: Filter): boolean {
  const actual = getPath(doc, field);
  switch (op) {
    case "==":
      return actual === value;
    case "!=":
      return actual !== value;
    case "<":
      return (actual as number) < (value as number);
    case "<=":
      return (actual as number) <= (value as number);
    case ">":
      return (actual as number) > (value as number);
    case ">=":
      return (actual as number) >= (value as number);
    case "array-contains":
      return Array.isArray(actual) && actual.includes(value);
    case "in":
      return Array.isArray(value) && value.includes(actual);
  }
}

/**
 * In-memory store. Optionally persists to a JSON file so local development
 * survives restarts. Reads and writes are deep-copied, so callers can never
 * mutate stored state by accident (the same guarantee Firestore gives).
 */
export class MemoryStore implements DocStore {
  readonly kind = "memory" as const;
  private data: Data = {};
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(private readonly file?: string) {
    if (file && existsSync(file)) {
      try {
        this.data = JSON.parse(readFileSync(file, "utf8")) as Data;
      } catch {
        this.data = {};
      }
    }
  }

  isEmpty() {
    return Object.keys(this.data).length === 0;
  }

  private col(name: string) {
    return (this.data[name] ??= {});
  }

  private persist() {
    if (!this.file) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      mkdirSync(dirname(this.file!), { recursive: true });
      writeFileSync(this.file!, JSON.stringify(this.data));
    }, 150);
  }

  async get<T>(col: string, id: string): Promise<T | null> {
    const doc = this.col(col)[id];
    return doc ? (structuredClone(doc) as T) : null;
  }

  async getMany<T>(col: string, ids: string[]): Promise<(T | null)[]> {
    return Promise.all(ids.map((id) => this.get<T>(col, id)));
  }

  async set(col: string, id: string, data: object): Promise<void> {
    this.col(col)[id] = stripUndefined(data) as Doc;
    this.persist();
  }

  async update(col: string, id: string, patch: Patch): Promise<void> {
    const doc = this.col(col)[id];
    if (!doc) throw new Error(`update: ${col}/${id} does not exist`);
    applyPatch(doc, patch);
    this.persist();
  }

  async remove(col: string, id: string): Promise<void> {
    delete this.col(col)[id];
    this.persist();
  }

  async query<T>(col: string, filters: Filter[] = [], limit?: number): Promise<T[]> {
    const out: T[] = [];
    for (const doc of Object.values(this.col(col))) {
      if (filters.every((f) => matches(doc, f))) {
        out.push(structuredClone(doc) as T);
        if (limit && out.length >= limit) break;
      }
    }
    return out;
  }

  async batch(ops: WriteOp[]): Promise<void> {
    // Validate first so a failing update leaves nothing half-applied.
    for (const op of ops) {
      if (op.type === "update" && !this.col(op.col)[op.id] && !ops.some((o) => o.type === "set" && o.col === op.col && o.id === op.id)) {
        throw new Error(`batch update: ${op.col}/${op.id} does not exist`);
      }
    }
    for (const op of ops) {
      if (op.type === "set") await this.set(op.col, op.id, op.data);
      else if (op.type === "update") await this.update(op.col, op.id, op.patch);
      else await this.remove(op.col, op.id);
    }
  }
}
