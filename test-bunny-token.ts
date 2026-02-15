// Test script to validate Bunny CDN Token generation
// Run with: deno run --allow-net test-bunny-token.ts

const BUNNY_TOKEN_KEY = "9d915d06-8f59-4edc-9d78-56d507f3d29e";
const BUNNY_CDN_HOST = "vz-2730fbe3-f6b.b-cdn.net";
const TEST_VIDEO_ID = "1cb92abc-fe8e-4e1d-ad6d-2707145715bc";

// SHA256 Base64Url encoding (same as in index.ts)
async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// Test 1: Directory-based token (standard for HLS)
async function testDirectoryToken() {
  const expires = Math.floor(Date.now() / 1000) + 600;
  const dirPath = `/${TEST_VIDEO_ID}/`;
  const tokenInput = `${BUNNY_TOKEN_KEY}${dirPath}${expires}`;
  
  console.log("\n=== Test 1: Directory Token ===");
  console.log("Token Input:", tokenInput);
  
  const token = await sha256Base64Url(tokenInput);
  const url = `https://${BUNNY_CDN_HOST}/${TEST_VIDEO_ID}/playlist.m3u8?token=${token}&expires=${expires}&token_path=${encodeURIComponent(dirPath)}`;
  
  console.log("Generated Token:", token);
  console.log("Full URL:", url);
  
  try {
    const response = await fetch(url);
    console.log("Response Status:", response.status);
    const text = await response.text();
    console.log("Response Preview:", text.substring(0, 200));
    return response.status === 200;
  } catch (error) {
    console.error("Fetch Error:", error);
    return false;
  }
}

// Test 2: File-specific token
async function testFileToken() {
  const expires = Math.floor(Date.now() / 1000) + 600;
  const filePath = `/${TEST_VIDEO_ID}/playlist.m3u8`;
  const tokenInput = `${BUNNY_TOKEN_KEY}${filePath}${expires}`;
  
  console.log("\n=== Test 2: File-Specific Token ===");
  console.log("Token Input:", tokenInput);
  
  const token = await sha256Base64Url(tokenInput);
  const url = `https://${BUNNY_CDN_HOST}/${TEST_VIDEO_ID}/playlist.m3u8?token=${token}&expires=${expires}&token_path=${encodeURIComponent(filePath)}`;
  
  console.log("Generated Token:", token);
  console.log("Full URL:", url);
  
  try {
    const response = await fetch(url);
    console.log("Response Status:", response.status);
    const text = await response.text();
    console.log("Response Preview:", text.substring(0, 200));
    return response.status === 200;
  } catch (error) {
    console.error("Fetch Error:", error);
    return false;
  }
}

// Test 3: Without token_path parameter
async function testWithoutTokenPath() {
  const expires = Math.floor(Date.now() / 1000) + 600;
  const dirPath = `/${TEST_VIDEO_ID}/`;
  const tokenInput = `${BUNNY_TOKEN_KEY}${dirPath}${expires}`;
  
  console.log("\n=== Test 3: Directory Token (No token_path param) ===");
  console.log("Token Input:", tokenInput);
  
  const token = await sha256Base64Url(tokenInput);
  const url = `https://${BUNNY_CDN_HOST}/${TEST_VIDEO_ID}/playlist.m3u8?token=${token}&expires=${expires}`;
  
  console.log("Generated Token:", token);
  console.log("Full URL:", url);
  
  try {
    const response = await fetch(url);
    console.log("Response Status:", response.status);
    const text = await response.text();
    console.log("Response Preview:", text.substring(0, 200));
    return response.status === 200;
  } catch (error) {
    console.error("Fetch Error:", error);
    return false;
  }
}

// Run all tests
console.log("Starting Bunny CDN Token Tests...");
console.log("Video ID:", TEST_VIDEO_ID);
console.log("CDN Host:", BUNNY_CDN_HOST);

const results = await Promise.all([
  testDirectoryToken(),
  testFileToken(),
  testWithoutTokenPath()
]);

console.log("\n=== RESULTS ===");
console.log("Test 1 (Directory Token):", results[0] ? "✅ PASS" : "❌ FAIL");
console.log("Test 2 (File Token):", results[1] ? "✅ PASS" : "❌ FAIL");
console.log("Test 3 (No token_path):", results[2] ? "✅ PASS" : "❌ FAIL");
