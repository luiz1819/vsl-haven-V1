// Lovable Cloud Function: bunny-stream-statistics
// Fetches video statistics from Bunny.net Stream API

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bunnyId, dateFrom, dateTo } = await req.json();

    if (!bunnyId) {
      return json({ error: "bunnyId is required" }, 400);
    }

    // Get Bunny.net credentials from environment
    const BUNNY_LIBRARY_ID = Deno.env.get("BUNNY_LIBRARY_ID");
    const BUNNY_API_KEY = Deno.env.get("BUNNY_API_KEY");

    if (!BUNNY_LIBRARY_ID || !BUNNY_API_KEY) {
      console.error("Missing Bunny.net credentials");
      return json({ error: "Server configuration error" }, 500);
    }

    // Build statistics endpoint
    // Bunny.net Stream API: GET /library/{libraryId}/videos/{videoGuid}/statistics
    const baseUrl = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${bunnyId}/statistics`;
    
    // Add optional date filters
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    
    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;

    console.log(`Fetching Bunny statistics: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "AccessKey": BUNNY_API_KEY,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Bunny API error (${response.status}):`, errorText);
      
      // Return empty stats instead of erroring for videos without data
      if (response.status === 404) {
        return json({
          bunnyId,
          viewsChart: [],
          countriesChart: [],
          engagementScore: 0,
          totalViews: 0,
          totalWatchTime: 0,
        });
      }
      
      return json({ error: `Bunny API error: ${response.status}` }, response.status);
    }

    const data = await response.json();

    // Transform Bunny response to our format
    const stats = {
      bunnyId,
      viewsChart: data.viewsChart || [],
      countriesChart: data.countriesChart || [],
      engagementScore: data.engagement || 0,
      totalViews: data.viewsChart?.reduce((sum: number, item: any) => sum + (item.value || 0), 0) || 0,
      totalWatchTime: data.watchedChart?.reduce((sum: number, item: any) => sum + (item.value || 0), 0) || 0,
      rawData: data, // Include full response for debugging
    };

    return json(stats);
  } catch (error) {
    console.error("Error fetching Bunny statistics:", error);
    return json({ error: String(error) }, 500);
  }
});
