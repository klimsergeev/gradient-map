// Утилиты для работы с цветом, RNG и мэппингом полосок.
// hex без `#` на входе и выходе.

export const DISTRIBUTIONS = {
    mix:   { label: 'Mix',   map: [0, 1, 2, 3, 4, 0, 1, 2, 0, 3, 1] },
    zones: { label: 'Zones', map: [0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 4] },
};

// ---- Hash + RNG ---------------------------------------------------------

// FNV-1a 32-bit
export function hashPalette(hex5) {
    const str = hex5.map((h) => h.replace('#', '')).join('');
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

export function mulberry32(seed) {
    let s = seed >>> 0;
    return function () {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), s | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---- HEX / RGB / HSL ----------------------------------------------------

export function hexToRgb(hex) {
    const h = hex.replace('#', '').trim();
    const full =
        h.length === 3
            ? h.split('').map((c) => c + c).join('')
            : h;
    const n = parseInt(full, 16);
    return {
        r: (n >> 16) & 0xff,
        g: (n >> 8) & 0xff,
        b: n & 0xff,
    };
}

export function rgbToHex(r, g, b) {
    const toH = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return toH(r) + toH(g) + toH(b);
}

export function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let s = 0;
    let h = 0;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hp = h / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;
    if (hp >= 0 && hp < 1) { r1 = c; g1 = x; }
    else if (hp < 2) { r1 = x; g1 = c; }
    else if (hp < 3) { g1 = c; b1 = x; }
    else if (hp < 4) { g1 = x; b1 = c; }
    else if (hp < 5) { r1 = x; b1 = c; }
    else { r1 = c; b1 = x; }
    const m = l - c / 2;
    return {
        r: Math.round((r1 + m) * 255),
        g: Math.round((g1 + m) * 255),
        b: Math.round((b1 + m) * 255),
    };
}

export function hexToHsl(hex) {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b);
}

export function hslToHex(h, s, l) {
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
}

// ---- Clamp --------------------------------------------------------------

export function clampSL(s, l) {
    return {
        s: Math.max(45, Math.min(90, s)),
        l: Math.max(25, Math.min(65, l)),
    };
}
