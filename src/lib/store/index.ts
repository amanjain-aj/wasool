import "server-only";
import { env, isSupabaseConfigured } from "../config";
import type { WasoolStore } from "./types";
import { createLocalStore } from "./local";
import { createSupabaseStore } from "./supabase";

export type { WasoolStore } from "./types";

const g = globalThis as unknown as { __wasoolStore?: WasoolStore };

/** Supabase when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, else the seeded local store. */
export function getStore(): WasoolStore {
  if (!g.__wasoolStore) {
    g.__wasoolStore = isSupabaseConfigured()
      ? createSupabaseStore(env.supabaseUrl(), env.supabaseServiceKey())
      : createLocalStore();
  }
  return g.__wasoolStore;
}
