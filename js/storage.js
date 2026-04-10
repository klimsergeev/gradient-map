import { PRESETS, STORAGE_KEYS } from './config.js';

export function readLS(key) {
    try {
        return localStorage.getItem(key);
    } catch (err) {
        console.warn('[storage] read failed:', err);
        return null;
    }
}

export function writeLS(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (err) {
        console.warn('[storage] write failed:', err);
        return false;
    }
}

export function removeLS(key) {
    try {
        localStorage.removeItem(key);
    } catch (err) {
        console.warn('[storage] remove failed:', err);
    }
}

export function readPaletteCache(key) {
    const raw = readLS(key);
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
        console.warn('[storage] palette cache parse failed:', err);
        return null;
    }
}

export function writePaletteCache(key, hex5) {
    try {
        writeLS(key, JSON.stringify(hex5));
    } catch (err) {
        console.warn('[storage] palette cache write failed:', err);
    }
}

export function clearAll() {
    removeLS('lastUpload');
    removeLS('selectedPreset');
    removeLS(STORAGE_KEYS.paletteUpload);
    for (const p of PRESETS) {
        removeLS(STORAGE_KEYS.palettePresetPrefix + p.id);
    }
}
