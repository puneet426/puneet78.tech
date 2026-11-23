import { defaultAutomations } from "./config";
import type { Automation, LogEntry, LogEvent, Stats } from "./types";

/**
 * Persistence via Upstash Redis REST (free tier; also what Vercel's "Upstash for Redis"
 * marketplace integration provisions). Falls back to in-memory storage when not configured,
 * which is fine for local testing but NOT for production on Vercel.
 */
/** Finds Upstash REST credentials whatever prefix the Vercel integration used (KV_, STORAGE_, ...). */
function findRedisEnv(): { url?: string; token?: string } {
  const env = process.env;
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
    return { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN };
  if (env.KV_REST_API_URL && env.KV_REST_API_TOKEN)
    return { url: env.KV_REST_API_URL, token: env.KV_REST_API_TOKEN };
  for (const key of Object.keys(env)) {
    if (!key.endsWith("_REST_API_URL")) continue;
    const token = env[key.replace(/_URL$/, "_TOKEN")];
    if (env[key] && token) return { url: env[key], token };
  }
  return {};
}
const { url: URL, token: TOKEN } = findRedisEnv();
const P = "igauto:";

type Mem = { kv: Map<string, { v: string; exp?: number }>; lists: Map<string, string[]> };
const g = globalThis as unknown as { __igMem?: Mem };
const mem: Mem = (g.__igMem ??= { kv: new Map(), lists: new Map() });

export const hasPersistentStore = Boolean(URL && TOKEN);

async function redis<T = unknown>(...cmd: (string | number)[]): Promise<T> {
  const res = await fetch(URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.error) throw new Error(`Redis: ${json.error}`);
  return json.result as T;
}

async function get(key: string): Promise<string | null> {
  if (hasPersistentStore) return redis<string | null>("GET", P + key);
  const e = mem.kv.get(key);
  if (!e || (e.exp && e.exp < Date.now())) return null;
  return e.v;
}

async function set(key: string, v: string, ttlSec?: number, nx = false): Promise<boolean> {
  if (hasPersistentStore) {
    const args: (string | number)[] = ["SET", P + key, v];
    if (ttlSec) args.push("EX", ttlSec);
    if (nx) args.push("NX");
    return (await redis<string | null>(...args)) === "OK";
  }
  const cur = await get(key);
  if (nx && cur !== null) return false;
  mem.kv.set(key, { v, exp: ttlSec ? Date.now() + ttlSec * 1000 : undefined });
  return true;
}

async function del(key: string) {
  if (hasPersistentStore) await redis("DEL", P + key);
  else mem.kv.delete(key);
}

// ---------- automations ----------
export async function getAutomations(): Promise<Automation[]> {
  const raw = await get("automations");
  if (!raw) return defaultAutomations;
  try {
    return JSON.parse(raw) as Automation[];
  } catch {
    return defaultAutomations;
  }
}

export async function saveAutomations(list: Automation[]) {
  await set("automations", JSON.stringify(list));
}

// ---------- dedupe (Meta retries webhooks) ----------
/** Returns true the first time an id is seen. */
export function claimOnce(id: string, ttlSec = 7 * 24 * 3600) {
  return set(`seen:${id}`, "1", ttlSec, true);
}

// ---------- pending conversations: user tapped/replied → which automation? ----------
export type Pending = { automationId: string; username?: string; stage?: "asked_follow" };
export function setPending(igsid: string, p: Pending) {
  return set(`pending:${igsid}`, JSON.stringify(p), 7 * 24 * 3600);
}
export async function getPending(igsid: string): Promise<Pending | null> {
  const raw = await get(`pending:${igsid}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Pending;
  } catch {
    return null;
  }
}
export function clearPending(igsid: string) {
  return del(`pending:${igsid}`);
}

// ---------- hourly rate limits (stay under Meta's automation limits) ----------
/** Increments this hour's counter for `kind` and returns the new count. */
export async function hitHourly(kind: string): Promise<number> {
  const hour = new Date().toISOString().slice(0, 13); // e.g. 2026-11-22T14
  const key = `rate:${kind}:${hour}`;
  if (hasPersistentStore) {
    const n = await redis<number>("INCR", P + key);
    if (n === 1) await redis("EXPIRE", P + key, 7200);
    return n;
  }
  const n = Number((await get(key)) ?? 0) + 1;
  await set(key, String(n), 7200);
  return n;
}

// ---------- logs + funnel stats ----------
const MAX_LOGS = 300;

export async function logEvent(entry: Omit<LogEntry, "at">) {
  const full: LogEntry = { at: Date.now(), ...entry };
  const statKey = entry.automationId ?? "_";
  try {
    if (hasPersistentStore) {
      await redis("LPUSH", P + "logs", JSON.stringify(full));
      await redis("LTRIM", P + "logs", 0, MAX_LOGS - 1);
      await redis("HINCRBY", P + "stats", `${statKey}|${entry.event}`, 1);
    } else {
      const l = mem.lists.get("logs") ?? [];
      l.unshift(JSON.stringify(full));
      mem.lists.set("logs", l.slice(0, MAX_LOGS));
      const k = `stats:${statKey}|${entry.event}`;
      const cur = Number((await get(k)) ?? 0);
      await set(k, String(cur + 1));
    }
  } catch (e) {
    console.error("[instagram] log failed", e);
  }
}

export async function getLogs(): Promise<LogEntry[]> {
  const raw = hasPersistentStore
    ? await redis<string[]>("LRANGE", P + "logs", 0, MAX_LOGS - 1)
    : mem.lists.get("logs") ?? [];
  return raw.map((r) => JSON.parse(r));
}

export async function getStats(): Promise<Stats> {
  const out: Stats = {};
  const add = (field: string, n: number) => {
    const [id, ev] = field.split("|");
    (out[id] ??= {})[ev as LogEvent] = n;
  };
  if (hasPersistentStore) {
    const flat = await redis<string[]>("HGETALL", P + "stats");
    for (let i = 0; i < flat.length; i += 2) add(flat[i], Number(flat[i + 1]));
  } else {
    for (const [k, e] of mem.kv) if (k.startsWith("stats:")) add(k.slice(6), Number(e.v));
  }
  return out;
}
