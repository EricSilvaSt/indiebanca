import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Server-side publishable-key client. Use inside server fn handlers only.
// RLS applies as anon — safe for public read-only data.
export function createPublicServerClient() {
  return createClient<Database, "indiebanca">(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      db: { schema: "indiebanca" },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}