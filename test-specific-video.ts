// Quick test to verify our token works for the specific video
const BUNNY_TOKEN_KEY = "9d915d06-8f59-4edc-9d78-56d507f3d29e";
const BUNNY_CDN_HOST = "vz-2730fbe3-f6b.b-cdn.net";
const TEST_VIDEO_ID = "1cb92abc-fe8e-4e1d-ad6d-2707145715bc"; // From user's screenshot

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

const expires = Math.floor(Date.now() / 1000) + 600;
const dirPath = `/${TEST_VIDEO_ID}/`;
const tokenInput = `${BUNNY_TOKEN_KEY}${dirPath}${expires}`;
const token = await sha256Base64Url(tokenInput);
const url = `https://${BUNNY_CDN_HOST}/${TEST_VIDEO_ID}/playlist.m3u8?token=${token}&expires=${expires}`;

console.log("Testing URL:", url);
console.log("\nFetching...");

try {
  const response = await fetch(url);
  console.log("Status:", response.status, response.statusText);
  
  if (response.ok) {
    const text = await response.text();
    console.log("\n✅ SUCCESS! Manifest preview:");
    console.log(text.substring(0, 500));
  } else {
    const error = await response.text();
    console.log("\n❌ FAILED! Error:");
    console.log(error.substring(0, 300));
  }
} catch (error) {
  console.error("Fetch error:", error);
}

export {};
