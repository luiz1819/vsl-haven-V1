// Lovable Cloud Function: bunny-hls-manifest
// Public endpoint: returns an HLS manifest with absolute, tokenized URLs.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function text(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Base64Url(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  // base64url (RFC 4648)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// Minimal MD5 implementation (returns raw 16 bytes).
// Used to support Bunny Token Authentication (Basic) mode.
function md5Raw(input: string): Uint8Array {
  // Based on RFC 1321; compact implementation for our single use.
  const utf8 = new TextEncoder().encode(input);

  const bytes = Array.from(utf8);
  const origLenBits = bytes.length * 8;
  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);

  // append length (little-endian 64-bit)
  for (let i = 0; i < 8; i++) bytes.push((origLenBits >>> (8 * i)) & 0xff);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const rotl = (x: number, s: number) => ((x << s) | (x >>> (32 - s))) >>> 0;
  const add = (x: number, y: number) => (x + y) >>> 0;

  const F = (x: number, y: number, z: number) => (x & y) | (~x & z);
  const G = (x: number, y: number, z: number) => (x & z) | (y & ~z);
  const H = (x: number, y: number, z: number) => x ^ y ^ z;
  const I = (x: number, y: number, z: number) => y ^ (x | ~z);

  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ];

  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  for (let i = 0; i < bytes.length; i += 64) {
    const M = new Array<number>(16);
    for (let j = 0; j < 16; j++) {
      const k = i + j * 4;
      M[j] = (bytes[k] | (bytes[k + 1] << 8) | (bytes[k + 2] << 16) | (bytes[k + 3] << 24)) >>> 0;
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let j = 0; j < 64; j++) {
      let f = 0;
      let g = 0;
      if (j < 16) {
        f = F(B, C, D);
        g = j;
      } else if (j < 32) {
        f = G(B, C, D);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = H(B, C, D);
        g = (3 * j + 5) % 16;
      } else {
        f = I(B, C, D);
        g = (7 * j) % 16;
      }

      const tmp = D;
      D = C;
      C = B;
      const sum = add(add(A, f), add(K[j]!, M[g]!));
      B = add(B, rotl(sum, S[j]!));
      A = tmp;
    }

    a0 = add(a0, A);
    b0 = add(b0, B);
    c0 = add(c0, C);
    d0 = add(d0, D);
  }

  const out = new Uint8Array(16);
  const words = [a0, b0, c0, d0];
  for (let i = 0; i < 4; i++) {
    const w = words[i]!;
    out[i * 4 + 0] = w & 0xff;
    out[i * 4 + 1] = (w >>> 8) & 0xff;
    out[i * 4 + 2] = (w >>> 16) & 0xff;
    out[i * 4 + 3] = (w >>> 24) & 0xff;
  }
  return out;
}

function base64UrlFromBytes(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function withToken(url: string, token: string, expires: number) {
  const join = url.includes("?") ? "&" : "?";
  return `${url}${join}token=${token}&expires=${expires}`;
}

function pathnameOf(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname);
  } catch {
    return "";
  }
}

function absolutizeAndTokenize(manifest: string, baseDirUrl: string, token: string, expires: number) {
  return manifest
    .split(/\r?\n/)
    .map((line) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return line;

      // Absolute URL
      if (/^https?:\/\//i.test(t)) {
        // For segments that are already absolute, we must re-sign them if they match the same CDN
        // or just append the same token if they are in the same folder.
        // Simplified: just append the token we generated for the folder.
        return withToken(t, token, expires);
      }

      // Relative path
      const abs = `${baseDirUrl}${t.replace(/^\//, "")}`;
      return withToken(abs, token, expires);
    })
    .join("\n");
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return text("Method not allowed", 405);

    const tokenKey = Deno.env.get("BUNNY_TOKEN_SECURITY_KEY");
    const cdnHost = Deno.env.get("BUNNY_STREAM_CDN_HOSTNAME");
    if (!tokenKey || !cdnHost) return text("Backend misconfigured", 500);

    const body = await req.json().catch(() => ({}));
    const bunnyId = typeof body?.bunnyId === "string" ? body.bunnyId : "";
    const expiresIn = Number(body?.expiresIn ?? 600);
    const safeExpiresIn = Number.isFinite(expiresIn) ? Math.max(60, Math.min(3600, expiresIn)) : 600;
    if (!bunnyId) return text("bunnyId is required", 400);

    const expires = Math.floor(Date.now() / 1000) + safeExpiresIn;
    const unsignedPlaylistUrl = `https://${cdnHost}/${bunnyId}/playlist.m3u8`;
    
    // CDN Token Authentication: For HLS streaming, Bunny typically uses DIRECTORY-based signing
    // This allows the same token to work for playlist.m3u8 AND all segment files (.ts)
    const dirPath = `/${bunnyId}/`;
    
    console.log("Attempting CDN Token Auth with directory path:", dirPath);
    console.log("Token Key (first 10 chars):", tokenKey.substring(0, 10) + "...");
    console.log("Expires:", expires);
    
    // Try SHA256 Base64Url (standard for Bunny CDN Token Auth)
    let shaToken = await sha256Base64Url(`${tokenKey}${dirPath}${expires}`);
    let shaUrl = withToken(unsignedPlaylistUrl, shaToken, expires);
    
    console.log("Testing SHA256 with directory token:", shaUrl);
    let res = await fetch(shaUrl, { method: "GET" });
    let manifest = await res.text();
    
    // Fallback 1: Try MD5 with directory path
    if (res.status === 403) {
      console.log("SHA256 directory failed (403), trying MD5 directory...");
      const md5Token = base64UrlFromBytes(md5Raw(`${tokenKey}${dirPath}${expires}`));
      const md5Url = withToken(unsignedPlaylistUrl, md5Token, expires);
      res = await fetch(md5Url, { method: "GET" });
      manifest = await res.text();
      shaToken = md5Token; // Update for segment rewriting
    }
    
    // Fallback 2: Try SHA256 with EXACT file path (less common but possible)
    if (res.status === 403) {
      console.log("MD5 directory failed (403), trying SHA256 with exact file path...");
      const filePath = `/${bunnyId}/playlist.m3u8`;
      shaToken = await sha256Base64Url(`${tokenKey}${filePath}${expires}`);
      shaUrl = withToken(unsignedPlaylistUrl, shaToken, expires);
      res = await fetch(shaUrl, { method: "GET" });
      manifest = await res.text();
    }

    if (!res.ok) {
      console.error("bunny-hls-manifest fetch failed", res.status, manifest.slice(0, 300));
      return json({
        error: "Failed to fetch manifest from Bunny",
        details: {
          status: res.status,
          bunnyError: manifest,
          cdnHost,
          bunnyId,
          dirPath,
          expires
        }
      }, 502);
    }

    const baseDirUrl = `https://${cdnHost}/${bunnyId}/`;
    // Use the directory token we already generated for segment rewriting
    // Since we authenticated with dirPath, the same token should work for all segments
    const rewritten = absolutizeAndTokenize(manifest, baseDirUrl, shaToken, expires);
    return text(rewritten, 200);
  } catch (err: any) {
    console.error("bunny-hls-manifest fatal", err);
    return json({ error: "Unexpected error", details: err?.message || String(err) }, 500);
  }
});