import { PRESETS, STORAGE_KEYS } from './config.js';
import { readPaletteCache, writePaletteCache } from './storage.js';

let imgEl = null;
let swatchEls = [];
let reqId = 0;
let currentPalette = null;

export function getCurrentPalette() {
    return currentPalette;
}

export function initPalette() {
    imgEl = document.querySelector('.banner__image');
    swatchEls = [...document.querySelectorAll('.palette-debug__swatch')];
    document.addEventListener('banner:image-changed', onImageChanged);
    // Первый preset мог отрендериться до initPalette — догоняем.
    if (imgEl?.src) {
        onImageChanged({ detail: { src: imgEl.src } });
    }
}

async function onImageChanged(ev) {
    const src = ev?.detail?.src;
    if (!src || !imgEl) return;
    const myReq = ++reqId;
    const isPreset = PRESETS.some((p) => src.endsWith(p.original));
    // Upload — это всегда одноразовый dataURL: кеш по общему ключу paletteUpload
    // даёт ложные hit'ы при повторных drop'ах. Читаем кеш только для пресетов.
    if (isPreset) {
        const cached = readPaletteCache(cacheKeyFor(src));
        if (cached && cached.length === 5) {
            render(cached);
            return;
        }
    }
    try {
        const hex5 = await extractPalette(imgEl, src);
        if (myReq !== reqId) return; // пришла новая картинка
        if (isPreset) writePaletteCache(cacheKeyFor(src), hex5);
        render(hex5);
    } catch (err) {
        console.warn('[palette] extract failed:', err);
    }
}

export async function extractPalette(_imageEl, src) {
    if (typeof ColorThief === 'undefined') {
        throw new Error('ColorThief missing');
    }
    // Свой Image, чтобы не зависеть от состояния banner img (быстрая смена пресетов).
    const img = await loadImage(src);
    const rawRes = await ColorThief.getPalette(img, {
        colorCount: 12,
        quality: 10,
        colorSpace: 'rgb',
        ignoreWhite: true,
    });
    if (!Array.isArray(rawRes) || rawRes.length === 0) {
        throw new Error('empty palette');
    }
    // Нормализация: v3 возвращает объекты {_r,_g,_b,...}, в старых версиях — [r,g,b].
    const raw = rawRes.map((c) =>
        Array.isArray(c) ? c : [c._r ?? c.r ?? 0, c._g ?? c.g ?? 0, c._b ?? c.b ?? 0]
    );
    const filtered = raw.filter(passHslFilter);
    const pick = filtered.length >= 5 ? filtered.slice(0, 5) : raw.slice(0, 5);
    while (pick.length < 5) pick.push([128, 128, 128]);
    return pick.map(rgbToHex);
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // НЕ ставим crossOrigin — пресеты same-origin, dataURL same-origin.
        const t = setTimeout(() => reject(new Error('image load timeout')), 5000);
        img.addEventListener('load', () => { clearTimeout(t); resolve(img); }, { once: true });
        img.addEventListener('error', () => { clearTimeout(t); reject(new Error('image load error')); }, { once: true });
        img.src = src;
        if (img.complete && img.naturalWidth > 0) {
            clearTimeout(t);
            resolve(img);
        }
    });
}

async function ensureImageReady(imageEl, expectedSrc) {
    // Считаем "готовой" только если src совпадает с ожидаемым и пиксели на месте.
    const matches = () =>
        imageEl.complete &&
        imageEl.naturalWidth > 0 &&
        (!expectedSrc ||
            imageEl.currentSrc === expectedSrc ||
            imageEl.src === expectedSrc ||
            imageEl.src.endsWith(expectedSrc));

    if (matches()) {
        if (imageEl.decode) {
            try { await imageEl.decode(); } catch (_) {}
        }
        return;
    }

    const ready = new Promise((res, rej) => {
        imageEl.addEventListener('load', res, { once: true });
        imageEl.addEventListener('error', rej, { once: true });
    });
    const timeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error('image ready timeout')), 5000)
    );
    await Promise.race([ready, timeout]);
}

function cacheKeyFor(src) {
    const preset = PRESETS.find((p) => src.endsWith(p.original));
    return preset
        ? STORAGE_KEYS.palettePresetPrefix + preset.id
        : STORAGE_KEYS.paletteUpload;
}

function passHslFilter(rgb) {
    const { s, l } = rgbToHsl(rgb[0], rgb[1], rgb[2]);
    return l >= 0.10 && l <= 0.92 && s >= 0.12;
}

function render(hex5) {
    currentPalette = hex5;
    swatchEls.forEach((el, i) => {
        if (hex5[i]) el.style.backgroundColor = '#' + hex5[i];
    });
    document.dispatchEvent(new CustomEvent('palette:ready', { detail: { hex5 } }));
}

function rgbToHex([r, g, b]) {
    const h = (n) => n.toString(16).padStart(2, '0');
    return h(r) + h(g) + h(b);
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
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
    return { h, s, l };
}
