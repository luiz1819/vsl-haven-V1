// Test if Bunny API returns pre-signed HLS URL
const BUNNY_API_KEY = "02d1b6e0-b73c-48d8-81525fd2cdb6-8d40-44b0";
const BUNNY_LIBRARY_ID = "589969";
const TEST_VIDEO_ID = "1cb92abc-fe8e-4e1d-ad6d-2707145715bc";

console.log("Fetching video info from Bunny API...\n");

try {
  const response = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${TEST_VIDEO_ID}`,
    {
      headers: {
        "AccessKey": BUNNY_API_KEY,
        "Accept": "application/json",
      },
    }
  );

  if (!response.ok) {
    console.error("❌ API Error:", response.status, response.statusText);
    const error = await response.text();
    console.error(error.substring(0, 500));
  } else {
    const data = await response.json();
    
    console.log("✅ Video Info Retrieved:");
    console.log("  Title:", data.title);
    console.log("  Status:", data.status, `(${getStatusText(data.status)})`);
    console.log("  Duration:", data.length, "seconds");
    console.log("\n📺 HLS Playlist URL:");
    console.log("  ", data.hls || "NOT AVAILABLE");
    
    if (data.hls) {
      console.log("\n🧪 Testing HLS URL...");
      const hlsResponse = await fetch(data.hls);
      console.log("  Status:", hlsResponse.status, hlsResponse.statusText);
      
      if (hlsResponse.ok) {
        const manifest = await hlsResponse.text();
        console.log("  Preview:", manifest.substring(0, 200));
      }
    }
  }
} catch (error) {
  console.error("❌ Fetch Error:", error);
}

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

export {};
