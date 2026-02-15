import * as React from "react";

function toCamelCase(input: string) {
    return input
        .trim()
        .toLowerCase()
        .replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/**
 * Parses a simple inline CSS string (e.g. "letter-spacing: 0.02em; text-transform: uppercase")
 * into a React style object.
 */
export function parseInlineStyle(styleText?: string | null): React.CSSProperties {
    const raw = (styleText ?? "").trim();
    if (!raw) return {};

    const out: Record<string, string> = {};
    for (const part of raw.split(";")) {
        const p = part.trim();
        if (!p) continue;
        const idx = p.indexOf(":");
        if (idx <= 0) continue;
        const key = toCamelCase(p.slice(0, idx));
        const value = p.slice(idx + 1).trim();
        if (!key || !value) continue;
        out[key] = value;
    }
    return out as unknown as React.CSSProperties;
}
