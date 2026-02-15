// Test the HLS URL provided by user from Bunny dashboard
const hlsUrl = "https://vz-2730fbe3-f6b.b-cdn.net/bcdn_token=948c8SQU8I8hXqWv2EgPPEQKvnOyT-mxH1gmvSsLnKQ&expires=1770172621&token_path=%2F1cb92abc-fe8e-4e1d-ad6d-2707145715bc%2F/1cb92abc-fe8e-4e1d-ad6d-2707145715bc/playlist.m3u8";

console.log("Testing Bunny Dashboard HLS URL...\n");
console.log("URL:", hlsUrl);
console.log("\nExpires:", new Date(1770172621 * 1000).toLocaleString());
console.log("Current:", new Date().toLocaleString());
console.log("\n");

try {
  const response = await fetch(hlsUrl);
  console.log("Status:", response.status, response.statusText);
  
  if (response.ok) {
    const manifest = await response.text();
    console.log("\n✅ SUCCESS! Manifest:");
    console.log(manifest);
  } else {
    const error = await response.text();
    console.log("\n❌ FAILED! Error:");
    console.log(error.substring(0, 500));
  }
} catch (error) {
  console.error("Fetch error:", error);
}

export {};
