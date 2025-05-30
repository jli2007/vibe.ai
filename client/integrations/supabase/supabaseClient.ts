// its viable to expose the anon and client key in client

import { createClient } from "@supabase/supabase-js";

export const supabaseClient = createClient(
  `https://${process.env.NEXT_PUBLIC_SUPABASE_CLIENT}.supabase.co`,
  process.env.NEXT_PUBLIC_SUPABASE_ANON!,
);