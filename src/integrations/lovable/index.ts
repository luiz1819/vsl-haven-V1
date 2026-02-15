// Lovable OAuth integration stub.
// The @lovable.dev/cloud-auth-js package is only available inside the Lovable
// platform. Outside of it we fall back to standard Supabase OAuth.

import { supabase } from "../supabase/client";

export const lovable = {
  auth: {
    signInWithOAuth: async (
      provider: "google" | "apple",
      opts?: { redirect_uri?: string },
    ) => {
      // Use native Supabase OAuth as fallback
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri ?? window.location.origin,
        },
      });

      if (error) {
        return { error, redirected: false };
      }

      // Supabase OAuth always redirects the browser
      return { redirected: true, error: null };
    },
  },
};
