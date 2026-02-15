// Lovable Cloud Function: delete-bunny-video
// Authenticated endpoint: verifies ownership and deletes the Bunny Stream video.

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
    const userId = claims?.claims?.sub ?? null;
    if (claimsErr || !userId) return json({ error: "Unauthorized" }, 401);

    const apiKey = Deno.env.get("BUNNY_STREAM_API_KEY");
    const libraryId = Deno.env.get("BUNNY_STREAM_LIBRARY_ID");
    if (!apiKey || !libraryId) return json({ error: "Bunny not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId : "";
    if (!videoId) return json({ error: "videoId is required" }, 400);

    const { data: row, error: rowErr } = await supabase
      .from("videos")
      .select("id,user_id,bunny_id")
      .eq("id", videoId)
      .maybeSingle();
    if (rowErr) {
      console.error("delete-bunny-video load row error", rowErr);
      return json({ error: "Failed to load video" }, 500);
    }
    if (!row || (row as any).user_id !== userId) return json({ error: "Not found" }, 404);

    const bunnyId = (row as any).bunny_id as string | null;
    if (!bunnyId) return json({ ok: true, skipped: true });

    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyId}`, {
      method: "DELETE",
      headers: { Accept: "application/json", AccessKey: apiKey },
    });
    
    // If video was already deleted (404), treat as success
    if (res.status === 404) {
      console.log("delete-bunny-video: video already deleted from Bunny (404), proceeding with DB cleanup");
      return json({ ok: true, alreadyDeleted: true });
    }
    
    const t = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("delete-bunny-video bunny delete failed", res.status, t);
      return json({ error: "Failed to delete Bunny video" }, 502);
    }

    return json({ ok: true });
  } catch (err) {
    console.error("delete-bunny-video fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
