import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BUNNY_API_KEY = Deno.env.get("BUNNY_API_KEY") ?? "";
const BUNNY_LIBRARY_ID = Deno.env.get("BUNNY_LIBRARY_ID") ?? "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const { bunnyId } = await req.json();
    
    if (!bunnyId) {
      return json({ error: "bunnyId is required" }, 400);
    }

    // Get video info from Bunny API (includes signed HLS URL)
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${bunnyId}`,
      {
        headers: {
          "AccessKey": BUNNY_API_KEY,
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Bunny API error:", response.status, error);
      return json({
        error: "Failed to fetch video from Bunny",
        details: { status: response.status, bunnyError: error }
      }, 502);
    }

    const videoData = await response.json();

    // Check if video is ready
    if (videoData.status !== 4) { // 4 = Finished encoding
      return json({
        error: "Video is still processing",
        details: {
          status: videoData.status,
          statusText: getStatusText(videoData.status)
        }
      }, 202); // 202 Accepted (processing)
    }

    // Return the HLS playlist URL (already signed by Bunny)
    return json({
      manifestUrl: videoData.hls || null,
      status: videoData.status,
      title: videoData.title,
      duration: videoData.length,
      thumbnailUrl: videoData.thumbnailFileName 
        ? `https://vz-${videoData.cdnHostname}.b-cdn.net/${bunnyId}/${videoData.thumbnailFileName}`
        : null
    }, 200);

  } catch (err: unknown) {
    console.error("bunny-video-url fatal", err);
    return json({ 
      error: "Unexpected error", 
      details: err instanceof Error ? err.message : String(err) 
    }, 500);
  }
});

function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    0: "Created",
    1: "Uploaded",
    2: "Processing",
    3: "Transcoding",
    4: "Finished",
    5: "Failed",
    6: "Deleted"
  };
  return statusMap[status] || "Unknown";
}
