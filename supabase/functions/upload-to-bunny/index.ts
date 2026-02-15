// Lovable Cloud Function: upload-to-bunny
// Authenticated endpoint that creates a Bunny Stream video object and returns TUS upload credentials.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!supabaseUrl || !anonKey) return json({ error: "Backend misconfigured" }, 500);
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("BUNNY_STREAM_API_KEY");
    const libraryId = Deno.env.get("BUNNY_STREAM_LIBRARY_ID");
    if (!apiKey || !libraryId) return json({ error: "Bunny not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title : "Untitled Video";

    // 1) Create video object
    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        AccessKey: apiKey,
      },
      body: JSON.stringify({ title }),
    });

    if (!createRes.ok) {
      const t = await createRes.text().catch(() => "");
      console.error("upload-to-bunny create failed", createRes.status, t);
      return json({ error: "Failed to create Bunny video" }, 500);
    }

    const created = (await createRes.json()) as { guid?: string };
    const bunnyId = created?.guid ?? "";
    if (!bunnyId) return json({ error: "Invalid Bunny response" }, 500);

    // 2) Generate TUS credentials
    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
    const signature = await sha256Hex(`${libraryId}${apiKey}${expirationTime}${bunnyId}`);

    return json({
      bunnyId,
      libraryId,
      expirationTime,
      signature,
      tusEndpoint: "https://video.bunnycdn.com/tusupload",
    });
  } catch (err) {
    console.error("upload-to-bunny fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
