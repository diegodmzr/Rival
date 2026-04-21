"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseConfigured } from "./env";

export function createClient() {
  assertSupabaseConfigured();
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
