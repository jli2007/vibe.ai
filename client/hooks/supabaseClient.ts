// connects client to supabase services --> viable to expose anon+client key without consequence.

import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  `https://${process.env.NEXT_PUBLIC_SUPABASE_CLIENT}.supabase.co`,
  process.env.NEXT_PUBLIC_SUPABASE_ANON!,
);