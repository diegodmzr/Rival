import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_URL } from "./env";

// Service-role client. Bypasses RLS — only use it in background work
// (cron jobs, cross-user notifications) where the request isn't on
// behalf of any given user's session.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error(
      "Admin Supabase client needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient<Database>(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
