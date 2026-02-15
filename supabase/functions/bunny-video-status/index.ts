// Lovable Cloud Function: bunny-video-status
// Authenticated endpoint: verifies ownership and returns Bunny processing status + thumbnail.

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

function mapStatus(raw: unknown): "uploading" | "transcoding" | "ready" | "error" {
  // Bunny returns different status representations across docs/SDKs.
  // We map conservatively.
  if (typeof raw === "string") {
    const s = raw.toLowerCase();
    if (s.includes("error") || s.includes("fail")) return "error";
    if (s.includes("upload")) return "uploading";
    if (s.includes("transcod") || s.includes("process")) return "transcoding";
    if (s.includes("ready") || s.includes("finished") || s.includes("done")) return "ready";
  }
  if (typeof raw === "number") {
    // Heuristic: 0/1 early, 2 processing, 3+ ready
    if (raw <= 1) return "uploading";
    if (raw === 2) return "transcoding";
    return "ready";
  }
  return "transcoding";
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
    const cdnHost = Deno.env.get("BUNNY_STREAM_CDN_HOSTNAME");
    if (!apiKey || !libraryId || !cdnHost) return json({ error: "Bunny not configured" }, 500);

    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId : "";
    if (!videoId) return json({ error: "videoId is required" }, 400);

    // Ownership check
    const { data: row, error: rowErr } = await supabase
      .from("videos")
      .select("id,user_id,bunny_id")
      .eq("id", videoId)
      .maybeSingle();
    if (rowErr) return json({ error: "Failed to load video" }, 500);
    if (!row || (row as any).user_id !== userId) return json({ error: "Not found" }, 404);

    const bunnyId = (row as any).bunny_id as string | null;
    if (!bunnyId) return json({ status: "error", error: "Video is not Bunny-backed" }, 400);

    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${bunnyId}`, {
      method: "GET",
      headers: { Accept: "application/json", AccessKey: apiKey },
    });
    const payloadText = await res.text().catch(() => "");
    if (!res.ok) {
      console.error("bunny-video-status failed", res.status, payloadText);
      return json({ error: "Failed to fetch Bunny status" }, 500);
    }

    let bunny: any = {};
    try {
      bunny = JSON.parse(payloadText);
    } catch {
      bunny = {};
    }

    const status = mapStatus(bunny?.status ?? bunny?.processingStatus ?? bunny?.encodeStatus);
    const thumbnailUrl = `https://${cdnHost}/${bunnyId}/thumbnail.jpg`;

    return json({ status, thumbnailUrl });
  } catch (err) {
    console.error("bunny-video-status fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
