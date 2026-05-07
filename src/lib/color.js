// Shared color utilities.
//
// Implements WCAG 2.1 SC 1.4.3 (contrast ratio).
//   ratio = (L1 + 0.05) / (L2 + 0.05) where L1 >= L2
//   L = relative luminance via the sRGB coefficient + gamma fix-up
//
// All-in-one parser + math. Hex (`#abc`, `#aabbcc`, `#aabbccdd`),
// `rgb(r, g, b)` and `rgba(r, g, b, a)`, `hsl(h, s%, l%)` and `hsla(...)`.
// Percentage-form rgb channels and percentage alpha are also accepted.

/**
 * Parse a CSS color string to {r, g, b, a} with channels in 0..255 and
 * alpha in 0..1. Returns null when the input can't be parsed.
 *
 * rgb channels above 255 / below 0 are silently clamped, matching modern
 * browser behavior.
 */
export function parseColor(input) {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase();
  if (s === '') return null;

  // Hex
  if (s[0] === '#') {
    const hex = s.slice(1);
    if (/^[0-9a-f]{3}$/.test(hex)) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1,
      };
    }
    if (/^[0-9a-f]{4}$/.test(hex)) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255,
      };
    }
    if (/^[0-9a-f]{6}$/.test(hex)) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      };
    }
    if (/^[0-9a-f]{8}$/.test(hex)) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255,
      };
    }
    return null;
  }

  // rgb / rgba — accepts integer channels, percentage channels, or a mix.
  // Modern space-separated syntax and slash-separated alpha are also accepted.
  const rgbMatch = s.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?%?|\d+)[,\s]+(\d+(?:\.\d+)?%?|\d+)[,\s]+(\d+(?:\.\d+)?%?|\d+)(?:[,\s/]+(\d+(?:\.\d+)?%?))?\s*\)$/
  );
  if (rgbMatch) {
    const parseChannel = (raw) => {
      if (raw === undefined) return undefined;
      if (raw.endsWith('%')) return clampByte((parseFloat(raw) / 100) * 255);
      return clampByte(Number(raw));
    };
    const parseAlpha = (raw) => {
      if (raw === undefined) return 1;
      if (raw.endsWith('%')) return clampUnit(parseFloat(raw) / 100);
      const n = Number(raw);
      return clampUnit(Number.isFinite(n) ? n : 1);
    };
    const r = parseChannel(rgbMatch[1]);
    const g = parseChannel(rgbMatch[2]);
    const b = parseChannel(rgbMatch[3]);
    const a = parseAlpha(rgbMatch[4]);
    return {r, g, b, a};
  }

  // hsl / hsla — convert to rgb.
  const hslMatch = s.match(
    /^hsla?\(\s*([\d.]+)(?:deg)?[,\s]+([\d.]+)%[,\s]+([\d.]+)%(?:[,\s/]+([\d.]+))?\s*\)$/
  );
  if (hslMatch) {
    const h = ((Number(hslMatch[1]) % 360) + 360) % 360;
    const s2 = clampUnit(Number(hslMatch[2]) / 100);
    const l = clampUnit(Number(hslMatch[3]) / 100);
    const aRaw = hslMatch[4] !== undefined ? Number(hslMatch[4]) : 1;
    const a = clampUnit(Number.isFinite(aRaw) ? aRaw : 1);
    const {r, g, b} = hslToRgb(h, s2, l);
    return {r, g, b, a};
  }

  return null;
}

function clampByte(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function clampUnit(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function hslToRgb(h, s, l) {
  // Standard formula.
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (h < 60) {
    r1 = c;
    g1 = x;
  } else if (h < 120) {
    r1 = x;
    g1 = c;
  } else if (h < 180) {
    g1 = c;
    b1 = x;
  } else if (h < 240) {
    g1 = x;
    b1 = c;
  } else if (h < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

/** Relative luminance per WCAG 2.x. */
export function relativeLuminance({r, g, b}) {
  const lin = (c) => {
    const sv = c / 255;
    // WCAG 2.x uses 0.03928; IEC 61966-2-1 uses 0.04045. WCAG-2.x value is
    // the one the standard normatively cites.
    return sv <= 0.03928 ? sv / 12.92 : Math.pow((sv + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Compute contrast ratio between two parsed colors. */
export function contrastRatio(fg, bg) {
  if (!fg || !bg) return 0;
  const lFg = relativeLuminance(fg);
  const lBg = relativeLuminance(bg);
  const lighter = Math.max(lFg, lBg);
  const darker = Math.min(lFg, lBg);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Format an {r,g,b} (alpha optional) to lowercase 6-digit hex. */
export function rgbToHex({r, g, b}) {
  const h = (n) => clampByte(n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Format an {r,g,b,a} to `rgb(...)` or `rgba(...)`. */
export function rgbToCss({r, g, b, a = 1}) {
  if (a >= 1) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
}

/**
 * Compose a foreground over a background using straight alpha blending.
 * Used to compute the contrast of a semi-transparent fg against a bg —
 * WCAG only defines contrast on opaque colors, so we blend first.
 */
export function compositeOver(fg, bg) {
  if (!fg || !bg) return null;
  const a = fg.a ?? 1;
  if (a >= 1) return {r: fg.r, g: fg.g, b: fg.b, a: 1};
  const blend = (cf, cb) => Math.round(cf * a + cb * (1 - a));
  return {
    r: blend(fg.r, bg.r),
    g: blend(fg.g, bg.g),
    b: blend(fg.b, bg.b),
    a: 1,
  };
}
