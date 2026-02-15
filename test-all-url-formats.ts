// Test both URL approaches for Bunny video playback
const BUNNY_TOKEN_KEY = "9d915d06-8f59-4edc-9d78-56d507f3d29e";
const BUNNY_CDN_HOST = "vz-2730fbe3-f6b.b-cdn.net";
const BUNNY_LIBRARY_ID = "589969";
const TEST_VIDEO_ID = "1cb92abc-fe8e-4e1d-ad6d-2707145715bc";

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

console.log("=".repeat(80));
console.log("TESTING BUNNY VIDEO URL FORMATS");
console.log("=".repeat(80));
console.log("\nVideo ID:", TEST_VIDEO_ID);
console.log("\n");

// ============================================================================
// TEST 1: iframe Embed (Bunny's built-in player)
// ============================================================================
console.log("📺 TEST 1: iframe Embed URL");
console.log("-".repeat(80));

const iframeUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${TEST_VIDEO_ID}`;
console.log("URL:", iframeUrl);

try {
  const response = await fetch(iframeUrl);
  console.log("Status:", response.status, response.statusText);
  
  if (response.ok) {
    const html = await response.text();
    const hasPlayer = html.includes("video") || html.includes("player");
    console.log("✅ SUCCESS! Contains player:", hasPlayer);
  } else {
    console.log("❌ FAILED");
  }
} catch (error) {
  console.error("❌ Error:", error);
}

console.log("\n");

// ============================================================================
// TEST 2: Direct Play URL (iframe without embed wrapper)
// ============================================================================
console.log("▶️  TEST 2: Direct Play URL");
console.log("-".repeat(80));

const directPlayUrl = `https://iframe.mediadelivery.net/play/${BUNNY_LIBRARY_ID}/${TEST_VIDEO_ID}`;
console.log("URL:", directPlayUrl);

try {
  const response = await fetch(directPlayUrl);
  console.log("Status:", response.status, response.statusText);
  
  if (response.ok) {
    const html = await response.text();
    const hasPlayer = html.includes("video") || html.includes("player");
    console.log("✅ SUCCESS! Contains player:", hasPlayer);
  } else {
    console.log("❌ FAILED");
  }
} catch (error) {
  console.error("❌ Error:", error);
}

console.log("\n");

// ============================================================================
// TEST 3: HLS with bcdn_token in PATH (Bunny Dashboard format)
// ============================================================================
console.log("🎬 TEST 3: HLS with bcdn_token in PATH (Dashboard format)");
console.log("-".repeat(80));

const expires = Math.floor(Date.now() / 1000) + 600;
const dirPath = `/${TEST_VIDEO_ID}/`;
const tokenInput = `${BUNNY_TOKEN_KEY}${dirPath}${expires}`;
const token = await sha256Base64Url(tokenInput);

// Format: /bcdn_token=XXX&expires=YYY&token_path=PATH/VIDEO_ID/playlist.m3u8
const pathTokenUrl = `https://${BUNNY_CDN_HOST}/bcdn_token=${token}&expires=${expires}&token_path=${encodeURIComponent(dirPath)}/${TEST_VIDEO_ID}/playlist.m3u8`;

console.log("URL:", pathTokenUrl);
console.log("Token:", token.substring(0, 20) + "...");
console.log("Expires:", new Date(expires * 1000).toLocaleString());

try {
  const response = await fetch(pathTokenUrl);
  console.log("Status:", response.status, response.statusText);
  
  if (response.ok) {
    const manifest = await response.text();
    console.log("✅ SUCCESS! Manifest preview:");
    console.log(manifest.substring(0, 200));
  } else {
    const error = await response.text();
    console.log("❌ FAILED! Error:");
    console.log(error.substring(0, 300));
  }
} catch (error) {
  console.error("❌ Error:", error);
}

console.log("\n");

// ============================================================================
// TEST 4: HLS with token as query parameter (Our current approach)
// ============================================================================
console.log("🔧 TEST 4: HLS with token as query parameter (Current approach)");
console.log("-".repeat(80));

const queryTokenUrl = `https://${BUNNY_CDN_HOST}/${TEST_VIDEO_ID}/playlist.m3u8?token=${token}&expires=${expires}`;

console.log("URL:", queryTokenUrl);

try {
  const response = await fetch(queryTokenUrl);
  console.log("Status:", response.status, response.statusText);
  
  if (response.ok) {
    const manifest = await response.text();
    console.log("✅ SUCCESS! Manifest preview:");
    console.log(manifest.substring(0, 200));
  } else {
    const error = await response.text();
    console.log("❌ FAILED! Error:");
    console.log(error.substring(0, 300));
  }
} catch (error) {
  console.error("❌ Error:", error);
}

console.log("\n");
console.log("=".repeat(80));
console.log("SUMMARY");
console.log("=".repeat(80));
console.log("\n✅ = Works | ❌ = Failed\n");
console.log("See results above for details.");

export {};
