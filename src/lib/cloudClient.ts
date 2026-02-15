import { createClient } from "@supabase/supabase-js";

// Lovable Cloud exposes these variables automatically.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !anonKey) {
  // Fail fast (but without leaking secrets)
  throw new Error("Backend environment variables are missing. Is the backend configured?");
}

export const cloud = createClient(url, anonKey);
