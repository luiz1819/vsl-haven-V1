export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// Stored in DB as: "H S% L%" (e.g. "210 90% 55%")
export function hexToHslParts(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (clean.length !== 6) return "0 0% 0%";

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  const hh = Math.round(clamp(h, 0, 360));
  const ss = Math.round(clamp(s * 100, 0, 100));
  const ll = Math.round(clamp(l * 100, 0, 100));
  return `${hh} ${ss}% ${ll}%`;
}

export function hslPartsToHex(parts: string | null | undefined): string {
  if (!parts) return "#000000";
  const m = parts.trim().match(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/);
  if (!m) return "#000000";

  const h = clamp(Number(m[1]), 0, 360);
  const s = clamp(Number(m[2]), 0, 100) / 100;
  const l = clamp(Number(m[3]), 0, 100) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = l - c / 2;
  let rr = 0,
    gg = 0,
    bb = 0;

  if (h < 60) {
    rr = c;
    gg = x;
  } else if (h < 120) {
    rr = x;
    gg = c;
  } else if (h < 180) {
    gg = c;
    bb = x;
  } else if (h < 240) {
    gg = x;
    bb = c;
  } else if (h < 300) {
    rr = x;
    bb = c;
  } else {
    rr = c;
    bb = x;
  }

  const toHex = (v: number) => Math.round((v + mm) * 255).toString(16).padStart(2, "0");
  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
}
