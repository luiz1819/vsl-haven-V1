// Lovable Cloud Function: telemetry-ping
// Public endpoint (no JWT) that records a ping every N seconds watched (default 5s).

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

function clampInt(n: number, min: number, max: number) {
  const v = Math.trunc(n);
  return Math.max(min, Math.min(max, v));
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing backend env vars");
      return json({ error: "Backend misconfigured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const videoId = typeof body?.videoId === "string" ? body.videoId : "";
    const anonId = typeof body?.anonId === "string" ? body.anonId : "";
    const positionSecondsRaw = Number(body?.positionSeconds);
    const incrementSecondsRaw = Number(body?.incrementSeconds ?? 5);

    if (!videoId) return json({ error: "videoId is required" }, 400);
    if (!anonId) return json({ error: "anonId is required" }, 400);
    if (!Number.isFinite(positionSecondsRaw)) return json({ error: "positionSeconds is required" }, 400);

    const positionSeconds = clampInt(positionSecondsRaw, 0, 60 * 60 * 6);
    const incrementSeconds = clampInt(incrementSecondsRaw, 1, 60);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1) Ensure session exists (unique by video_id+anon_id)
    const { data: sessionRow, error: sErr } = await supabase
      .from("video_view_sessions")
      .upsert(
        {
          video_id: videoId,
          anon_id: anonId,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "video_id,anon_id" },
      )
      .select("id,total_watched_seconds,max_position_seconds")
      .maybeSingle();

    if (sErr) {
      console.error("telemetry-ping session upsert error", sErr);
      return json({ error: "Failed to record session" }, 500);
    }
    if (!sessionRow?.id) return json({ error: "Failed to create session" }, 500);

    const sessionId = sessionRow.id as string;

    // 2) Insert ping
    const { error: pErr } = await supabase.from("video_view_pings").insert({
      video_id: videoId,
      session_id: sessionId,
      position_seconds: positionSeconds,
      increment_seconds: incrementSeconds,
    });
    if (pErr) {
      console.error("telemetry-ping insert ping error", pErr);
      return json({ error: "Failed to record ping" }, 500);
    }

    // 3) Update aggregates
    const nextTotal = clampInt(Number(sessionRow.total_watched_seconds ?? 0) + incrementSeconds, 0, 60 * 60 * 24);
    const nextMax = Math.max(clampInt(Number(sessionRow.max_position_seconds ?? 0), 0, 60 * 60 * 24), positionSeconds);
    const { error: uErr } = await supabase
      .from("video_view_sessions")
      .update({
        total_watched_seconds: nextTotal,
        max_position_seconds: nextMax,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (uErr) console.error("telemetry-ping update aggregates error", uErr);

    console.log("telemetry-ping ok", { videoId, sessionId, positionSeconds, incrementSeconds });
    return json({ ok: true, sessionId });
  } catch (err) {
    console.error("telemetry-ping fatal", err);
    return json({ error: "Unexpected error" }, 500);
  }
});
