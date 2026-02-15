import { createClient } from "@supabase/supabase-js";

// Lovable Cloud exposes these variables automatically.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    "VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing. " +
    "The Supabase client will use placeholder values and most features will not work."
  );
}

export const cloud = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key",
);
