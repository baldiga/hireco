import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client. Server-only: bypasses RLS, so every query must scope by user_id.
export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
